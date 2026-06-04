'use server'

import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { signTicketId } from '@/lib/ticket-token'
import { getRegistrationFee } from '@/lib/registrationFee'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.codeinnovators.africa'

const writeClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
})

function generateTicketId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const bytes = crypto.randomBytes(8)
    return 'CI-' + Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

export interface TicketFormData {
    customerName: string
    email: string
    schoolName: string
    phone?: string
}

export async function initializeTicketPayment(data: TicketFormData) {
    try {
        const feeKes = await getRegistrationFee()
        const ticketId = generateTicketId()
        const reference = ticketId

        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: data.email,
                amount: feeKes * 100,
                reference,
                currency: 'KES',
                callback_url: `${BASE_URL}/tickets/verify`,
                metadata: { ticketId, customerName: data.customerName, schoolName: data.schoolName, phone: data.phone || '' },
            }),
        })

        const paystackData = await paystackRes.json()
        if (!paystackData.status) {
            return { success: false, error: paystackData.message || 'Payment initialization failed.' }
        }

        await writeClient.create({
            _type: 'ticket',
            ticketId,
            customerName: data.customerName,
            email: data.email,
            schoolName: data.schoolName || '',
            phone: data.phone || '',
            amount: feeKes,
            paystackReference: reference,
            status: 'pending',
            ticketType: 'School Pass',
            issuedAt: new Date().toISOString(),
        })

        return { success: true, url: paystackData.data.authorization_url as string }
    } catch (err) {
        console.error('Paystack init error:', err)
        return { success: false, error: 'Could not initialize payment. Please try again.' }
    }
}

export async function verifyTicketPayment(reference: string) {
    try {
        const res = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, cache: 'no-store' }
        )
        const data = await res.json()

        if (!data.status || data.data.status !== 'success') {
            return { success: false, error: 'Payment not successful.' }
        }

        // Verify correct amount was paid
        const feeKes = await getRegistrationFee()
        const paidKobo: number = data.data.amount ?? 0
        if (paidKobo < feeKes * 100) {
            return { success: false, error: 'Payment amount is insufficient.' }
        }

        // Verify currency
        if (data.data.currency !== 'KES') {
            return { success: false, error: 'Invalid payment currency.' }
        }

        const ticketId = data.data.metadata?.ticketId || reference

        // Prevent reference reuse
        const alreadyPaid = await writeClient.fetch<{ _id: string; status: string } | null>(
            `*[_type == "ticket" && paystackReference == $ref][0]{ _id, status }`,
            { ref: reference }
        )
        if (alreadyPaid?.status === 'paid') {
            // Already paid — just return the token so they can view their ticket
            return { success: true, ticketId, token: signTicketId(ticketId) }
        }

        if (alreadyPaid?._id) {
            await writeClient.patch(alreadyPaid._id).set({ status: 'paid' }).commit()
        }

        return { success: true, ticketId, token: signTicketId(ticketId) }
    } catch (err) {
        console.error('Paystack verify error:', err)
        return { success: false, error: 'Verification failed. Please contact support.' }
    }
}
