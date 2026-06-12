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
    totalLearners: number
    totalAmountKes: number
    paymentMethod: 'money' | 'coupon' | 'unknown'
    couponCode?: string
    reference?: string
    submittedAt?: string
    teams: AdminTeam[]
    observerNames: string[]
    ticketLink: string | null
}

export interface AdminTransaction {
    schoolName: string
    contactPerson: string
    method: 'money' | 'coupon'
    amountKes: number
    couponCode?: string
    reference?: string
    students: number
    date?: string
}

export interface AdminCoupon {
    code: string
    type: 'free' | 'discount'
    feePerLearnerKes?: number
    isUsed: boolean
    usedBy?: string
    usedAt?: string
}

export interface AdminStats {
    schools: number
    teams: number
    students: number
    observers: number
    moneySchools: number
    moneyStudents: number
    couponSchools: number
    couponStudents: number
    revenueKes: number
    couponValueKes: number
    byCategory: { category: string; teams: number; moneyStudents: number; couponStudents: number; students: number }[]
}

export interface AdminDashboard {
    stats: AdminStats
    schools: AdminSchool[]
    transactions: AdminTransaction[]
    coupons: AdminCoupon[]
}

function pinOk(pin: string): boolean {
    if (!ADMIN_PIN) return false
    try {
        return crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(ADMIN_PIN))
    } catch {
        return false
    }
}

const nameCount = (arr?: string[]) => (Array.isArray(arr) ? arr.filter((n) => n && n.trim()).length : 0)

type RegRow = {
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

export async function getAdminDashboard(
    pin: string
): Promise<{ ok: true; data: AdminDashboard } | { ok: false; error: string }> {
    if (!pinOk(pin)) return { ok: false, error: 'invalid_pin' }

    const [rows, couponRows] = await Promise.all([
        readClient.fetch<RegRow[]>(
            `*[_type == "schoolRegistration"] | order(submittedAt desc) {
                registrationId, schoolName, contactPerson, email, phone,
                totalLearners, totalAmountKes, couponCode, paystackReference, submittedAt,
                "teams": teams[]{ teamName, category, thematicArea, learnerNames },
                observerNames,
                "firstTicketId": *[_type == "ticket" && registrationId == ^.registrationId && status == "paid"] | order(teamNumber asc)[0].ticketId
            }`,
            {},
            { cache: 'no-store' }
        ),
        readClient.fetch<{
            code: string
            discountType?: string
            feePerLearnerKes?: number
            isUsed?: boolean
            usedBy?: string
            usedAt?: string
        }[]>(
            `*[_type == "coupon"] | order(isUsed asc, code asc){ code, discountType, feePerLearnerKes, isUsed, usedBy, usedAt }`,
            {},
            { cache: 'no-store' }
        ),
    ])

    const schools: AdminSchool[] = []
    const transactions: AdminTransaction[] = []
    const categoryMap = new Map<string, { teams: number; money: number; coupon: number }>()
    const stats: AdminStats = {
        schools: rows.length, teams: 0, students: 0, observers: 0,
        moneySchools: 0, moneyStudents: 0, couponSchools: 0, couponStudents: 0,
        revenueKes: 0, couponValueKes: 0, byCategory: [],
    }

    for (const r of rows) {
        const teams = r.teams ?? []
        const students = r.totalLearners ?? teams.reduce((s, t) => s + nameCount(t.learnerNames), 0)
        const observers = nameCount(r.observerNames)
        const amount = r.totalAmountKes ?? 0
        const method: AdminSchool['paymentMethod'] = r.couponCode ? 'coupon' : r.paystackReference ? 'money' : 'unknown'

        stats.teams += teams.length
        stats.students += students
        stats.observers += observers
        if (method === 'money')  { stats.moneySchools++;  stats.moneyStudents += students;  stats.revenueKes += amount }
        if (method === 'coupon') { stats.couponSchools++; stats.couponStudents += students; stats.couponValueKes += amount }

        for (const t of teams) {
            const cat = t.category || 'Uncategorized'
            const cur = categoryMap.get(cat) ?? { teams: 0, money: 0, coupon: 0 }
            cur.teams++
            const n = nameCount(t.learnerNames)
            if (method === 'coupon') cur.coupon += n
            else if (method === 'money') cur.money += n
            categoryMap.set(cat, cur)
        }

        const link = r.firstTicketId
            ? `${BASE_URL}/tickets/${r.firstTicketId}?token=${signTicketId(r.firstTicketId)}`
            : null

        schools.push({
            registrationId: r.registrationId,
            schoolName: r.schoolName,
            contactPerson: r.contactPerson,
            email: r.email,
            phone: r.phone,
            totalLearners: students,
            totalAmountKes: amount,
            paymentMethod: method,
            couponCode: r.couponCode,
            reference: r.paystackReference,
            submittedAt: r.submittedAt,
            teams,
            observerNames: (r.observerNames ?? []).filter((o) => o && o.trim()),
            ticketLink: link,
        })

        if (method !== 'unknown') {
            transactions.push({
                schoolName: r.schoolName,
                contactPerson: r.contactPerson,
                method,
                amountKes: amount,
                couponCode: r.couponCode,
                reference: r.paystackReference,
                students,
                date: r.submittedAt,
            })
        }
    }

    stats.byCategory = [...categoryMap.entries()]
        .map(([category, v]) => ({ category, teams: v.teams, moneyStudents: v.money, couponStudents: v.coupon, students: v.money + v.coupon }))
        .sort((a, b) => b.students - a.students)

    const coupons: AdminCoupon[] = (couponRows ?? []).map((c) => ({
        code: c.code,
        type: c.discountType === 'fixedPerLearner' ? 'discount' : 'free',
        feePerLearnerKes: c.feePerLearnerKes,
        isUsed: !!c.isUsed,
        usedBy: c.usedBy,
        usedAt: c.usedAt,
    }))

    return { ok: true, data: { stats, schools, transactions, coupons } }
}
