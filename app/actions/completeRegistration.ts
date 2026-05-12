'use server'

import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { signTicketId } from '@/lib/ticket-token'
import { getRegistrationFee } from '@/lib/registrationFee'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

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

export interface TeamData {
    teamName: string
    category: string
    thematicArea: string
    learnerNames: string[]
}

export interface RegistrationPayload {
    schoolName: string
    contactPerson: string
    email: string
    phone: string
    teams: TeamData[]
}

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

export async function completeRegistrationWithPayment(
    paystackReference: string,
    data: RegistrationPayload
) {
    try {
        // 0. Validate payload structure before touching Paystack
        const validationError = validatePayload(data)
        if (validationError) return { success: false, error: validationError }

        if (!/^[A-Za-z0-9_-]{4,100}$/.test(paystackReference)) {
            return { success: false, error: 'Invalid payment reference.' }
        }

        // 1. Verify payment with Paystack
        const res = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, cache: 'no-store' }
        )
        const paystackData = await res.json()

        if (!paystackData.status || paystackData.data?.status !== 'success') {
            return { success: false, error: 'Payment could not be verified. Please contact support.' }
        }

        // 2. Verify the email on the Paystack transaction matches the registration email
        const paystackEmail: string = paystackData.data?.customer?.email ?? ''
        if (paystackEmail.toLowerCase() !== data.email.trim().toLowerCase()) {
            return { success: false, error: 'Payment email does not match registration email.' }
        }

        // 3. Verify amount (feePerLearner × totalLearners)
        const feeKes        = await getRegistrationFee()
        const totalLearners = data.teams.reduce((s, t) => s + t.learnerNames.length, 0)
        const paidKobo: number = paystackData.data.amount ?? 0
        if (paidKobo < feeKes * totalLearners * 100) {
            return { success: false, error: 'Payment amount is insufficient.' }
        }

        // 4. Verify currency
        if (paystackData.data.currency !== 'KES') {
            return { success: false, error: 'Invalid payment currency.' }
        }

        // 5. Prevent reference reuse
        const alreadyUsed = await writeClient.fetch<{ _id: string } | null>(
            `*[_type == "ticket" && paystackReference == $ref && status == "paid"][0]{ _id }`,
            { ref: paystackReference }
        )
        if (alreadyUsed) {
            return { success: false, error: 'This payment has already been used.' }
        }

        const totalAmountKes = feeKes * totalLearners
        const registrationId = crypto.randomBytes(8).toString('hex')
        const issuedAt = new Date().toISOString()

        // 5. Save registration
        await writeClient.create({
            _type: 'schoolRegistration',
            schoolName: data.schoolName,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone || undefined,
            teams: data.teams,
            totalLearners,
            totalAmountKes,
            registrationId,
            paystackReference,
            submittedAt: issuedAt,
        })

        // 6. Create one ticket per team
        const firstTicketId = generateTicketId()
        const ticketIds: string[] = []

        for (let i = 0; i < data.teams.length; i++) {
            const team = data.teams[i]
            const ticketId = i === 0 ? firstTicketId : generateTicketId()
            ticketIds.push(ticketId)

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
                paystackReference,
                status: 'paid',
                ticketType: 'School Pass',
                issuedAt,
            })
        }

        const token = signTicketId(firstTicketId)
        return { success: true, ticketId: firstTicketId, token }
    } catch (err) {
        console.error('completeRegistration error:', err)
        return { success: false, error: 'Registration failed. Please try again.' }
    }
}
