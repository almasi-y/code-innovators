'use server'

import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { signTicketId } from '@/lib/ticket-token'

const ADMIN_PIN = process.env.CHECKIN_PIN ?? ''
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.codeinnovators.africa'

const readClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
})

export interface AdminTeam {
    teamName?: string
    category?: string
    thematicArea?: string
    learnerNames?: string[]
}

export interface AdminSchool {
    registrationId: string
    schoolName: string
    contactPerson: string
    email: string
    phone?: string
    totalLearners?: number
    totalAmountKes?: number
    paymentMethod: 'money' | 'coupon' | 'unknown'
    couponCode?: string
    submittedAt?: string
    teams: AdminTeam[]
    observerNames?: string[]
    ticketLink: string | null
}

function pinOk(pin: string): boolean {
    if (!ADMIN_PIN) return false
    try {
        return crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(ADMIN_PIN))
    } catch {
        return false
    }
}

/**
 * Returns every school registration with a ready-to-send ticket link.
 * PIN-gated with the same CHECKIN_PIN used for the check-in page.
 */
export async function listSchools(
    pin: string
): Promise<{ ok: true; schools: AdminSchool[] } | { ok: false; error: string }> {
    if (!pinOk(pin)) return { ok: false, error: 'invalid_pin' }

    type Row = {
        registrationId: string
        schoolName: string
        contactPerson: string
        email: string
        phone?: string
        totalLearners?: number
        totalAmountKes?: number
        couponCode?: string
        paystackReference?: string
        submittedAt?: string
        teams?: AdminTeam[]
        observerNames?: string[]
        firstTicketId?: string
    }

    const rows = await readClient.fetch<Row[]>(
        `*[_type == "schoolRegistration"] | order(submittedAt desc) {
            registrationId, schoolName, contactPerson, email, phone,
            totalLearners, totalAmountKes, couponCode, paystackReference, submittedAt,
            "teams": teams[]{ teamName, category, thematicArea, learnerNames },
            observerNames,
            "firstTicketId": *[_type == "ticket" && registrationId == ^.registrationId && status == "paid"] | order(teamNumber asc)[0].ticketId
        }`,
        {},
        { cache: 'no-store' }
    )

    const schools: AdminSchool[] = rows.map((r) => {
        const link = r.firstTicketId
            ? `${BASE_URL}/tickets/${r.firstTicketId}?token=${signTicketId(r.firstTicketId)}`
            : null
        const paymentMethod: AdminSchool['paymentMethod'] = r.couponCode
            ? 'coupon'
            : r.paystackReference
              ? 'money'
              : 'unknown'
        return {
            registrationId: r.registrationId,
            schoolName: r.schoolName,
            contactPerson: r.contactPerson,
            email: r.email,
            phone: r.phone,
            totalLearners: r.totalLearners,
            totalAmountKes: r.totalAmountKes,
            paymentMethod,
            couponCode: r.couponCode,
            submittedAt: r.submittedAt,
            teams: r.teams ?? [],
            observerNames: r.observerNames ?? [],
            ticketLink: link,
        }
    })

    return { ok: true, schools }
}
