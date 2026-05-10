'use server'

import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { signTicketId } from '@/lib/ticket-token'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const TICKET_AMOUNT_KES = 20 // change to 1000 for production

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

export interface RegistrationPayload {
    schoolName: string
    contactPerson: string
    email: string
    phone: string
    teamName: string
    thematicArea: string
    category: string
    learnerNames: string[]
}

export async function completeRegistrationWithPayment(
    paystackReference: string,
    data: RegistrationPayload
) {
    try {
        // 1. Verify payment with Paystack
        const res = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, cache: 'no-store' }
        )
        const paystackData = await res.json()

        if (!paystackData.status || paystackData.data?.status !== 'success') {
            return { success: false, error: 'Payment could not be verified. Please contact support.' }
        }

        // 2. Verify the amount paid is correct (prevents underpayment attacks)
        const paidKobo: number = paystackData.data.amount ?? 0
        if (paidKobo < TICKET_AMOUNT_KES * 100) {
            return { success: false, error: 'Payment amount is insufficient.' }
        }

        // 3. Verify currency is KES
        if (paystackData.data.currency !== 'KES') {
            return { success: false, error: 'Invalid payment currency.' }
        }

        // 4. Prevent reference reuse — one paid reference = one ticket
        const alreadyUsed = await writeClient.fetch<{ _id: string } | null>(
            `*[_type == "ticket" && paystackReference == $ref && status == "paid"][0]{ _id }`,
            { ref: paystackReference }
        )
        if (alreadyUsed) {
            return { success: false, error: 'This payment has already been used.' }
        }

        // 5. Save the registration
        await writeClient.create({
            _type: 'schoolRegistration',
            schoolName: data.schoolName,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone || undefined,
            teamName: data.teamName,
            thematicArea: data.thematicArea,
            category: data.category,
            learnerNames: data.learnerNames,
            paystackReference,
            submittedAt: new Date().toISOString(),
        })

        // 6. Create a paid ticket
        const ticketId = generateTicketId()
        await writeClient.create({
            _type: 'ticket',
            ticketId,
            customerName: data.contactPerson,
            email: data.email,
            schoolName: data.schoolName,
            phone: data.phone || '',
            amount: TICKET_AMOUNT_KES,
            paystackReference,
            status: 'paid',
            ticketType: 'School Pass',
            issuedAt: new Date().toISOString(),
        })

        // 7. Sign the ticket ID so only the holder can view it
        const token = signTicketId(ticketId)
        return { success: true, ticketId, token }
    } catch (err) {
        console.error('completeRegistration error:', err)
        return { success: false, error: 'Registration failed. Please try again.' }
    }
}
