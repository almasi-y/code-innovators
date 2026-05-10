'use server'

import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { signTicketId } from '@/lib/ticket-token'
import type { RegistrationPayload } from './completeRegistration'

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

export async function redeemCouponAndRegister(
    couponCode: string,
    data: RegistrationPayload
) {
    // Normalise — uppercase, strip spaces
    const code = couponCode.trim().toUpperCase()

    if (!/^[A-Z0-9]{4,16}$/.test(code)) {
        return { success: false, error: 'Invalid coupon format.' }
    }

    // Fetch coupon
    const coupon = await writeClient.fetch<{
        _id: string
        _rev: string
        code: string
        isUsed: boolean
    } | null>(
        `*[_type == "coupon" && code == $code][0]{ _id, _rev, code, isUsed }`,
        { code }
    )

    if (!coupon) {
        return { success: false, error: 'Coupon not found.' }
    }

    if (coupon.isUsed) {
        return { success: false, error: 'This coupon has already been used.' }
    }

    // Mark coupon as used — patch with revision check to prevent race conditions
    try {
        await writeClient
            .patch(coupon._id)
            .ifRevisionId(coupon._rev)
            .set({
                isUsed: true,
                usedBy: data.schoolName,
                usedByEmail: data.email,
                usedAt: new Date().toISOString(),
            })
            .commit()
    } catch {
        // Another request redeemed it between our fetch and patch
        return { success: false, error: 'This coupon was just used by someone else. Please contact support.' }
    }

    // Save the registration
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
        couponCode: code,
        submittedAt: new Date().toISOString(),
    })

    // Create a paid ticket (coupon = 100% off)
    const ticketId = generateTicketId()
    await writeClient.create({
        _type: 'ticket',
        ticketId,
        customerName: data.contactPerson,
        email: data.email,
        schoolName: data.schoolName,
        phone: data.phone || '',
        amount: 0,
        couponCode: code,
        status: 'paid',
        ticketType: 'School Pass',
        issuedAt: new Date().toISOString(),
    })

    const token = signTicketId(ticketId)
    return { success: true, ticketId, token }
}
