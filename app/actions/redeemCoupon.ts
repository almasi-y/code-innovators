'use server'

import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { signTicketId } from '@/lib/ticket-token'
import type { RegistrationPayload } from './completeRegistration'

const MAX_TEAMS    = 3
const MAX_LEARNERS = 5

function validatePayload(data: RegistrationPayload): string | null {
    if (!data.schoolName?.trim())    return 'School name is required.'
    if (!data.contactPerson?.trim()) return 'Contact person is required.'
    if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Valid email is required.'
    if (!Array.isArray(data.teams) || data.teams.length < 1) return 'At least one team is required.'
    if (data.teams.length > MAX_TEAMS) return `Maximum ${MAX_TEAMS} teams allowed.`
    for (const team of data.teams) {
        if (!team.teamName?.trim()) return 'Each team must have a name.'
        if (!team.category?.trim()) return 'Each team must have a category.'
        if (!team.thematicArea?.trim()) return 'Each team must have a thematic area.'
        if (!Array.isArray(team.learnerNames) || team.learnerNames.length < 1) return 'Each team must have at least one learner.'
        if (team.learnerNames.length > MAX_LEARNERS) return `Maximum ${MAX_LEARNERS} learners per team.`
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
    } | null>(
        `*[_type == "coupon" && code == $code][0]{ _id, _rev, code, isUsed }`,
        { code }
    )

    if (!coupon)       return { success: false, error: 'Coupon not found.' }
    if (coupon.isUsed) return { success: false, error: 'This coupon has already been used.' }

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
        teams: data.teams,
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
