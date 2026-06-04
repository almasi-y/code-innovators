'use server'

import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { signTicketId } from '@/lib/ticket-token'
import type { RegistrationPayload } from './completeRegistration'
import { learnerLimit, MAX_OBSERVERS, SERVER_MAX_TEAMS } from '@/lib/registrationLimits'

function validatePayload(data: RegistrationPayload): string | null {
    if (!data.schoolName?.trim())    return 'School name is required.'
    if (!data.contactPerson?.trim()) return 'Contact person is required.'
    if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Valid email is required.'
    if (!Array.isArray(data.teams) || data.teams.length < 1) return 'At least one team is required.'
    if (data.teams.length > SERVER_MAX_TEAMS) return `Too many teams.`
    for (const team of data.teams) {
        if (!team.teamName?.trim()) return 'Each team must have a name.'
        if (!team.category?.trim()) return 'Each team must have a category.'
        if (!team.thematicArea?.trim()) return 'Each team must have a thematic area.'
        const lim = learnerLimit(team.category)
        const count = Array.isArray(team.learnerNames) ? team.learnerNames.filter(n => n.trim()).length : 0
        if (count < lim.min) return `Each team must have at least ${lim.min} learners.`
        if (count > lim.max) return `Maximum ${lim.max} learners for ${team.category}.`
    }
    if (data.observerNames && data.observerNames.length > MAX_OBSERVERS) {
        return `Maximum ${MAX_OBSERVERS} observers per school.`
    }
    return null
}

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
    const validationError = validatePayload(data)
    if (validationError) return { success: false, error: validationError }

    const code = couponCode.trim().toUpperCase()

    if (!/^[A-Z0-9]{4,16}$/.test(code)) {
        return { success: false, error: 'Invalid coupon format.' }
    }

    const coupon = await writeClient.fetch<{
        _id: string
        _rev: string
        code: string
        isUsed: boolean
        discountType?: string
    } | null>(
        `*[_type == "coupon" && code == $code][0]{ _id, _rev, code, isUsed, discountType }`,
        { code }
    )

    if (!coupon)       return { success: false, error: 'Coupon not found.' }
    if (coupon.isUsed) return { success: false, error: 'This coupon has already been used.' }
    if (coupon.discountType === 'fixedPerLearner') {
        return { success: false, error: 'This coupon requires payment. Please use it at checkout.' }
    }

    try {
        await writeClient
            .patch(coupon._id)
            .ifRevisionId(coupon._rev)
            .set({ isUsed: true, usedBy: data.schoolName, usedByEmail: data.email, usedAt: new Date().toISOString() })
            .commit()
    } catch {
        return { success: false, error: 'This coupon was just used by someone else. Please contact support.' }
    }

    const totalLearners = data.teams.reduce((s, t) => s + t.learnerNames.length, 0)
    const registrationId = crypto.randomBytes(8).toString('hex')
    const issuedAt = new Date().toISOString()

    await writeClient.create({
        _type: 'schoolRegistration',
        schoolName: data.schoolName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone || undefined,
        teams: data.teams.map(t => ({ ...t, _key: crypto.randomBytes(4).toString('hex') })),
        observerNames: data.observerNames?.filter(o => o.trim()) ?? [],
        totalLearners,
        totalAmountKes: 0,
        registrationId,
        couponCode: code,
        submittedAt: issuedAt,
    })

    // One ticket per team
    const firstTicketId = generateTicketId()

    for (let i = 0; i < data.teams.length; i++) {
        const team = data.teams[i]
        const ticketId = i === 0 ? firstTicketId : generateTicketId()

        await writeClient.create({
            _type: 'ticket',
            ticketId,
            registrationId,
            customerName: data.contactPerson,
            email: data.email,
            schoolName: data.schoolName,
            phone: data.phone || '',
            teamName: team.teamName,
            teamNumber: i + 1,
            totalTeams: data.teams.length,
            category: team.category,
            thematicArea: team.thematicArea,
            learnerNames: team.learnerNames,
            amount: 0,
            couponCode: code,
            status: 'paid',
            ticketType: 'School Pass',
            issuedAt,
        })
    }

    const token = signTicketId(firstTicketId)
    return { success: true, ticketId: firstTicketId, token }
}

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

/**
 * Redeems a "fixed price per learner" coupon. Unlike a free coupon, the school
 * still pays — but at the coupon's discounted rate (e.g. KES 700/learner)
 * instead of the standard fee. Payment is verified before the coupon is consumed.
 */
export async function redeemDiscountCouponWithPayment(
    couponCode: string,
    paystackReference: string,
    data: RegistrationPayload
) {
    try {
        const validationError = validatePayload(data)
        if (validationError) return { success: false, error: validationError }

        const code = couponCode.trim().toUpperCase()
        if (!/^[A-Z0-9]{4,16}$/.test(code)) return { success: false, error: 'Invalid coupon format.' }
        if (!/^[A-Za-z0-9_-]{4,100}$/.test(paystackReference)) {
            return { success: false, error: 'Invalid payment reference.' }
        }

        const coupon = await writeClient.fetch<{
            _id: string
            _rev: string
            isUsed: boolean
            discountType?: string
            feePerLearnerKes?: number
        } | null>(
            `*[_type == "coupon" && code == $code][0]{ _id, _rev, isUsed, discountType, feePerLearnerKes }`,
            { code }
        )

        if (!coupon)       return { success: false, error: 'Coupon not found.' }
        if (coupon.isUsed) return { success: false, error: 'This coupon has already been used.' }
        if (coupon.discountType !== 'fixedPerLearner') {
            return { success: false, error: 'This coupon does not require payment.' }
        }
        const feeKes = Number(coupon.feePerLearnerKes)
        if (!feeKes || feeKes <= 0) return { success: false, error: 'Coupon is misconfigured. Please contact support.' }

        // Verify the payment with Paystack
        const res = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, cache: 'no-store' }
        )
        const pd = await res.json()
        if (!pd.status || pd.data?.status !== 'success') {
            return { success: false, error: 'Payment could not be verified. Please contact support.' }
        }
        const payEmail: string = pd.data?.customer?.email ?? ''
        if (payEmail.toLowerCase() !== data.email.trim().toLowerCase()) {
            return { success: false, error: 'Payment email does not match registration email.' }
        }
        if (pd.data.currency !== 'KES') return { success: false, error: 'Invalid payment currency.' }

        const totalLearners = data.teams.reduce((s, t) => s + t.learnerNames.length, 0)
        const paidKobo: number = pd.data.amount ?? 0
        if (paidKobo < feeKes * totalLearners * 100) {
            return { success: false, error: 'Payment amount is insufficient.' }
        }

        // Prevent reference reuse
        const alreadyUsed = await writeClient.fetch<{ _id: string } | null>(
            `*[_type == "ticket" && paystackReference == $ref && status == "paid"][0]{ _id }`,
            { ref: paystackReference }
        )
        if (alreadyUsed) return { success: false, error: 'This payment has already been used.' }

        // Consume the coupon atomically (race-safe)
        try {
            await writeClient
                .patch(coupon._id)
                .ifRevisionId(coupon._rev)
                .set({ isUsed: true, usedBy: data.schoolName, usedByEmail: data.email, usedAt: new Date().toISOString() })
                .commit()
        } catch {
            return { success: false, error: 'This coupon was just used by someone else. Please contact support.' }
        }

        const totalAmountKes = feeKes * totalLearners
        const registrationId = crypto.randomBytes(8).toString('hex')
        const issuedAt = new Date().toISOString()

        await writeClient.create({
            _type: 'schoolRegistration',
            schoolName: data.schoolName,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone || undefined,
            teams: data.teams.map(t => ({ ...t, _key: crypto.randomBytes(4).toString('hex') })),
            observerNames: data.observerNames?.filter(o => o.trim()) ?? [],
            totalLearners,
            totalAmountKes,
            registrationId,
            couponCode: code,
            paystackReference,
            submittedAt: issuedAt,
        })

        const firstTicketId = generateTicketId()
        for (let i = 0; i < data.teams.length; i++) {
            const team = data.teams[i]
            const ticketId = i === 0 ? firstTicketId : generateTicketId()

            await writeClient.create({
                _type: 'ticket',
                ticketId,
                registrationId,
                customerName: data.contactPerson,
                email: data.email,
                schoolName: data.schoolName,
                phone: data.phone || '',
                teamName: team.teamName,
                teamNumber: i + 1,
                totalTeams: data.teams.length,
                category: team.category,
                thematicArea: team.thematicArea,
                learnerNames: team.learnerNames,
                amount: feeKes * team.learnerNames.length,
                couponCode: code,
                paystackReference,
                status: 'paid',
                ticketType: 'School Pass',
                issuedAt,
            })
        }

        const token = signTicketId(firstTicketId)
        return { success: true, ticketId: firstTicketId, token }
    } catch (err) {
        console.error('redeemDiscountCouponWithPayment error:', err)
        return { success: false, error: 'Registration failed. Please try again.' }
    }
}
