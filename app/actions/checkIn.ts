'use server'

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { verifyTicketToken } from '@/lib/ticket-token'

const writeClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
})

function pinValid(pin: string) {
    return pin === process.env.CHECKIN_PIN
}

export type TicketCheckInResult =
    | { status: 'invalid_pin' }
    | { status: 'invalid_ticket' }
    | { status: 'not_paid' }
    | { status: 'already_checked_in'; checkedInAt: string; customerName: string; schoolName: string }
    | { status: 'valid'; customerName: string; schoolName: string; ticketType: string; ticketId: string }

export async function getTicketForCheckIn(
    ticketId: string,
    token: string,
    pin: string
): Promise<TicketCheckInResult> {
    if (!pinValid(pin)) return { status: 'invalid_pin' }

    if (!/^CI-[A-Z0-9]{8}$/.test(ticketId)) return { status: 'invalid_ticket' }
    if (!verifyTicketToken(ticketId, token)) return { status: 'invalid_ticket' }

    const ticket = await writeClient.fetch<{
        _id: string
        customerName: string
        schoolName: string
        ticketType: string
        status: string
        checkedIn: boolean
        checkedInAt: string | null
    } | null>(
        `*[_type == "ticket" && ticketId == $ticketId][0]{
            _id, customerName, schoolName, ticketType, status, checkedIn, checkedInAt
        }`,
        { ticketId }
    )

    if (!ticket) return { status: 'invalid_ticket' }
    if (ticket.status !== 'paid') return { status: 'not_paid' }

    if (ticket.checkedIn) {
        return {
            status: 'already_checked_in',
            checkedInAt: ticket.checkedInAt ?? '',
            customerName: ticket.customerName,
            schoolName: ticket.schoolName,
        }
    }

    return {
        status: 'valid',
        customerName: ticket.customerName,
        schoolName: ticket.schoolName,
        ticketType: ticket.ticketType,
        ticketId,
    }
}

export async function checkInTicket(
    ticketId: string,
    token: string,
    pin: string
): Promise<{ success: boolean; error?: string }> {
    if (!pinValid(pin)) return { success: false, error: 'Invalid PIN.' }
    if (!/^CI-[A-Z0-9]{8}$/.test(ticketId)) return { success: false, error: 'Invalid ticket.' }
    if (!verifyTicketToken(ticketId, token)) return { success: false, error: 'Invalid ticket token.' }

    const ticket = await writeClient.fetch<{
        _id: string
        _rev: string
        status: string
        checkedIn: boolean
    } | null>(
        `*[_type == "ticket" && ticketId == $ticketId][0]{ _id, _rev, status, checkedIn }`,
        { ticketId }
    )

    if (!ticket) return { success: false, error: 'Ticket not found.' }
    if (ticket.status !== 'paid') return { success: false, error: 'Ticket is not paid.' }
    if (ticket.checkedIn) return { success: false, error: 'Already checked in.' }

    try {
        await writeClient
            .patch(ticket._id)
            .ifRevisionId(ticket._rev)
            .set({ checkedIn: true, checkedInAt: new Date().toISOString() })
            .commit()
        return { success: true }
    } catch {
        return { success: false, error: 'Check-in conflict. Please try again.' }
    }
}
