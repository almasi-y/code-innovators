'use server'

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { verifyTicketToken } from '@/lib/ticket-token'
import { getRegistrationFee } from '@/lib/registrationFee'
import { learnerLimit } from '@/lib/registrationLimits'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

const writeClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
})

interface TicketRow {
    _id: string
    _rev: string
    category?: string
    learnerNames?: string[]
    registrationId?: string
    teamNumber?: number
    teamName?: string
    status?: string
}

interface RegTeam {
    _key: string
    teamName?: string
    learnerNames?: string[]
}

interface RegRow {
    _id: string
    teams?: RegTeam[]
}

/**
 * Adds a single learner to an already-paid team after a fresh KES-fee payment.
 * Auth is the ticket token (the teacher already owns the ticket link).
 */
export async function addLearnerToTeam(args: {
    ticketId: string
    token: string
    learnerName: string
    paystackReference: string
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { ticketId, token, paystackReference } = args
        const name = (args.learnerName ?? '').trim()

        // 1. Authorize: token must match this ticket
        if (!verifyTicketToken(ticketId, token)) {
            return { success: false, error: 'Unauthorized.' }
        }
        if (!name) return { success: false, error: 'Learner name is required.' }
        if (name.length > 80) return { success: false, error: 'Name is too long.' }
        if (!/^[A-Za-z0-9_-]{4,100}$/.test(paystackReference)) {
            return { success: false, error: 'Invalid payment reference.' }
        }

        // 2. Load the ticket
        const ticket = await writeClient.fetch<TicketRow | null>(
            `*[_type == "ticket" && ticketId == $id][0]{
                _id, _rev, category, learnerNames, registrationId, teamNumber, teamName, status
            }`,
            { id: ticketId },
            { cache: 'no-store' }
        )
        if (!ticket) return { success: false, error: 'Ticket not found.' }
        if (ticket.status !== 'paid') return { success: false, error: 'This ticket is not active.' }

        // 3. Prevent reusing a payment reference
        const used = await writeClient.fetch<{ _id: string } | null>(
            `*[_type == "ticket" && (paystackReference == $ref || $ref in topUpReferences)][0]{ _id }`,
            { ref: paystackReference },
            { cache: 'no-store' }
        )
        if (used) return { success: false, error: 'This payment has already been used.' }

        // 4. Verify the payment with Paystack
        const res = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, cache: 'no-store' }
        )
        const pd = await res.json()
        if (!pd.status || pd.data?.status !== 'success') {
            return { success: false, error: 'Payment could not be verified.' }
        }
        if (pd.data.currency !== 'KES') {
            return { success: false, error: 'Invalid payment currency.' }
        }
        const feeKes = await getRegistrationFee()
        const paidKobo: number = pd.data.amount ?? 0
        if (paidKobo < feeKes * 100) {
            return { success: false, error: 'Payment amount is insufficient.' }
        }

        // 5. Enforce per-category maximum
        const lim = learnerLimit(ticket.category ?? '')
        const current = (ticket.learnerNames ?? []).filter((n) => n.trim())
        if (current.length >= lim.max) {
            return {
                success: false,
                error: `This team already has the maximum ${lim.max} learners for ${ticket.category}.`,
            }
        }

        // 6. Update the ticket — append learner, record the payment, bump amount
        await writeClient
            .patch(ticket._id)
            .ifRevisionId(ticket._rev)
            .setIfMissing({ learnerNames: [], topUpReferences: [] })
            .append('learnerNames', [name])
            .append('topUpReferences', [paystackReference])
            .inc({ amount: feeKes })
            .commit()

        // 7. Mirror onto the school registration document
        if (ticket.registrationId) {
            const reg = await writeClient.fetch<RegRow | null>(
                `*[_type == "schoolRegistration" && registrationId == $rid][0]{
                    _id, "teams": teams[]{ _key, teamName, learnerNames }
                }`,
                { rid: ticket.registrationId },
                { cache: 'no-store' }
            )
            if (reg?.teams?.length) {
                // Match by teamNumber (1-based) first, then fall back to teamName
                let team: RegTeam | undefined
                if (ticket.teamNumber && reg.teams[ticket.teamNumber - 1]) {
                    const cand = reg.teams[ticket.teamNumber - 1]
                    if (!ticket.teamName || cand.teamName === ticket.teamName) team = cand
                }
                if (!team) team = reg.teams.find((t) => t.teamName === ticket.teamName)

                if (team?._key) {
                    await writeClient
                        .patch(reg._id)
                        .setIfMissing({ [`teams[_key=="${team._key}"].learnerNames`]: [] })
                        .append(`teams[_key=="${team._key}"].learnerNames`, [name])
                        .inc({ totalLearners: 1, totalAmountKes: feeKes })
                        .commit()
                }
            }
        }

        return { success: true }
    } catch (err) {
        console.error('addLearnerToTeam error:', err)
        return { success: false, error: 'Could not add learner. Please contact support.' }
    }
}
