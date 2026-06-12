'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { getAdminDashboard, type AdminDashboard, type AdminSchool } from '@/app/actions/admin'

const PIN_KEY = 'ci_admin_pin'
const kes = (n: number) => 'KES ' + (n ?? 0).toLocaleString()

type Tab = 'overview' | 'schools' | 'transactions' | 'coupons'

export default function AdminPage() {
    const [pin, setPin] = useState('')
    const [pinError, setPinError] = useState('')
    const [data, setData] = useState<AdminDashboard | null>(null)
    const [tab, setTab] = useState<Tab>('overview')
    const [query, setQuery] = useState('')
    const [copied, setCopied] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [autoChecking, setAutoChecking] = useState(false)

    useEffect(() => {
        const saved = sessionStorage.getItem(PIN_KEY)
        if (!saved) return
        setPin(saved)
        setAutoChecking(true)
        getAdminDashboard(saved)
            .then((r) => { if (r.ok) setData(r.data); else sessionStorage.removeItem(PIN_KEY) })
            .finally(() => setAutoChecking(false))
    }, [])

    function submitPin(e: React.FormEvent) {
        e.preventDefault()
        setPinError('')
        startTransition(async () => {
            const r = await getAdminDashboard(pin)
            if (!r.ok) { setPinError('Incorrect PIN. Try again.'); return }
            sessionStorage.setItem(PIN_KEY, pin)
            setData(r.data)
        })
    }

    function refresh() {
        startTransition(async () => {
            const r = await getAdminDashboard(pin)
            if (r.ok) setData(r.data)
        })
    }

    async function copyLink(s: AdminSchool) {
        if (!s.ticketLink) return
        try {
            await navigator.clipboard.writeText(s.ticketLink)
            setCopied(s.registrationId)
            setTimeout(() => setCopied(null), 1600)
        } catch {
            window.prompt('Copy this link:', s.ticketLink)
        }
    }

    const filteredSchools = useMemo(() => {
        if (!data) return []
        const q = query.trim().toLowerCase()
        if (!q) return data.schools
        return data.schools.filter((s) =>
            s.schoolName?.toLowerCase().includes(q) ||
            s.contactPerson?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q))
    }, [data, query])

    // ── PIN gate ──────────────────────────────────────────────
    if (!data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <form onSubmit={submitPin} className="w-full max-w-xs">
                    <p className="text-white font-display text-2xl text-center mb-1">Organizer Admin</p>
                    <p className="text-white/40 text-xs text-center mb-5">Enter your PIN to continue</p>
                    <input
                        type="password" inputMode="numeric" value={pin} autoFocus suppressHydrationWarning
                        onChange={(e) => setPin(e.target.value)} placeholder="PIN"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-[0.3em] placeholder:tracking-normal focus:outline-none focus:border-[#8b7ff5]" />
                    {pinError && <p className="text-red-400 text-xs text-center mt-3">{pinError}</p>}
                    {autoChecking && <p className="text-white/30 text-xs text-center mt-3">Checking saved PIN…</p>}
                    <button type="submit" disabled={isPending || !pin}
                        className="w-full mt-4 bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors">
                        {isPending ? 'Checking…' : 'Unlock'}
                    </button>
                </form>
            </div>
        )
    }

    const { stats, schools, transactions, coupons } = data
    const usedCoupons = coupons.filter((c) => c.isUsed).length

    return (
        <div className="min-h-screen bg-background text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                    <div>
                        <h1 className="font-display text-3xl">Dashboard</h1>
                        <p className="text-white/40 text-sm mt-1">Code Innovators Festival · live registration data</p>
                    </div>
                    <button onClick={refresh} disabled={isPending}
                        className="text-white/60 hover:text-white text-sm border border-white/15 rounded-full px-4 py-2 transition-colors disabled:opacity-40">
                        {isPending ? 'Refreshing…' : '↻ Refresh'}
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <Stat label="Schools" value={stats.schools} />
                    <Stat label="Teams" value={stats.teams} />
                    <Stat label="Students" value={stats.students} />
                    <Stat label="Observers" value={stats.observers} />
                    <Stat label="Revenue (money)" value={kes(stats.revenueKes)} accent />
                    <Stat label="Paid (money)" value={`${stats.moneySchools} schools · ${stats.moneyStudents} students`} small />
                    <Stat label="Coupon redemptions" value={`${stats.couponSchools} schools · ${stats.couponStudents} students`} small />
                    <Stat label="Coupons used" value={`${usedCoupons} / ${coupons.length}`} small />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-white/10 mb-5 overflow-x-auto">
                    {(['overview', 'schools', 'transactions', 'coupons'] as Tab[]).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                tab === t ? 'border-[#8b7ff5] text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}>
                            {t}{t === 'transactions' && ` (${transactions.length})`}{t === 'schools' && ` (${schools.length})`}
                        </button>
                    ))}
                </div>

                {/* ── Overview ── */}
                {tab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <Panel title="Students by category">
                            <Table head={['Category', 'Teams', 'By money', 'By coupon', 'Total']}
                                rows={[
                                    ...stats.byCategory.map((c) => [c.category, c.teams, c.moneyStudents, c.couponStudents, c.students]),
                                    ['Total',
                                        stats.byCategory.reduce((s, c) => s + c.teams, 0),
                                        stats.byCategory.reduce((s, c) => s + c.moneyStudents, 0),
                                        stats.byCategory.reduce((s, c) => s + c.couponStudents, 0),
                                        stats.byCategory.reduce((s, c) => s + c.students, 0)],
                                ]} alignRight={[1, 2, 3, 4]} boldLastRow />
                        </Panel>
                        <Panel title="Payment split">
                            <Table head={['Type', 'Schools', 'Students', 'Amount']}
                                rows={[
                                    ['Money', stats.moneySchools, stats.moneyStudents, kes(stats.revenueKes)],
                                    ['Coupon', stats.couponSchools, stats.couponStudents, kes(stats.couponValueKes)],
                                    ['Total', stats.moneySchools + stats.couponSchools, stats.students, kes(stats.revenueKes + stats.couponValueKes)],
                                ]} alignRight={[1, 2, 3]} boldLastRow />
                        </Panel>
                    </div>
                )}

                {/* ── Schools ── */}
                {tab === 'schools' && (
                    <>
                        <input value={query} onChange={(e) => setQuery(e.target.value)} suppressHydrationWarning
                            placeholder="Search school, contact or email…"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#8b7ff5] mb-4" />
                        <div className="flex flex-col gap-3">
                            {filteredSchools.map((s) => (
                                <div key={s.registrationId} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-lg leading-tight">{s.schoolName}</p>
                                            <p className="text-white/50 text-sm">{s.contactPerson} · {s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                                        </div>
                                        <Badge method={s.paymentMethod} amount={s.totalAmountKes} code={s.couponCode} />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                        <Chip>{s.teams.length} teams</Chip>
                                        <Chip>{s.totalLearners} students</Chip>
                                        {s.observerNames.length > 0 && <Chip>{s.observerNames.length} observers</Chip>}
                                    </div>
                                    <div className="mt-3 flex flex-col gap-1">
                                        {s.teams.map((t, i) => (
                                            <p key={i} className="text-white/45 text-xs">
                                                <span className="text-white/70">{t.teamName || `Team ${i + 1}`}</span>
                                                {t.category ? ` — ${t.category}` : ''}
                                                {t.learnerNames?.length ? ` · ${t.learnerNames.filter(Boolean).join(', ')}` : ''}
                                            </p>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        {s.ticketLink ? (
                                            <>
                                                <button onClick={() => copyLink(s)}
                                                    className="bg-[#8b7ff5] hover:bg-[#7a6ee0] text-white text-xs font-semibold rounded-full px-3.5 py-1.5 transition-colors">
                                                    {copied === s.registrationId ? '✓ Copied' : 'Copy ticket link'}
                                                </button>
                                                <a href={s.ticketLink} target="_blank" rel="noopener noreferrer"
                                                    className="text-white/60 hover:text-white text-xs border border-white/15 rounded-full px-3.5 py-1.5 transition-colors">Open</a>
                                            </>
                                        ) : <span className="text-red-400/70 text-xs">No paid ticket found.</span>}
                                    </div>
                                </div>
                            ))}
                            {filteredSchools.length === 0 && <p className="text-white/40 text-sm text-center py-10">No schools match “{query}”.</p>}
                        </div>
                    </>
                )}

                {/* ── Transactions ── */}
                {tab === 'transactions' && (
                    <Panel title={`${transactions.length} transactions`}>
                        <Table
                            head={['School', 'Method', 'Students', 'Amount', 'Reference', 'Date']}
                            rows={transactions.map((t) => [
                                t.schoolName,
                                t.method === 'coupon' ? `Coupon ${t.couponCode ?? ''}` : 'Money',
                                t.students,
                                kes(t.amountKes),
                                t.reference || (t.couponCode ?? '—'),
                                t.date ? new Date(t.date).toLocaleDateString() : '—',
                            ])}
                            alignRight={[2, 3]} mono={[4]} />
                    </Panel>
                )}

                {/* ── Coupons ── */}
                {tab === 'coupons' && (
                    <Panel title={`${coupons.length} coupons · ${usedCoupons} used`}>
                        <Table
                            head={['Code', 'Type', 'Rate', 'Status', 'Used by', 'Used at']}
                            rows={coupons.map((c) => [
                                c.code,
                                c.type === 'discount' ? 'Discount' : 'Free',
                                c.type === 'discount' ? kes(c.feePerLearnerKes ?? 0) + '/learner' : '100% off',
                                c.isUsed ? '● Used' : '○ Available',
                                c.usedBy ?? '—',
                                c.usedAt ? new Date(c.usedAt).toLocaleDateString() : '—',
                            ])}
                            mono={[0]} />
                    </Panel>
                )}
            </div>
        </div>
    )
}

function Stat({ label, value, accent, small }: { label: string; value: string | number; accent?: boolean; small?: boolean }) {
    return (
        <div className={`rounded-2xl border p-4 ${accent ? 'bg-[#8b7ff5]/10 border-[#8b7ff5]/30' : 'bg-white/5 border-white/10'}`}>
            <p className="text-white/40 text-[11px] uppercase tracking-widest">{label}</p>
            <p className={`mt-1 font-display ${small ? 'text-sm' : 'text-2xl'} ${accent ? 'text-[#b9aeff]' : 'text-white'}`}>{value}</p>
        </div>
    )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <p className="px-4 py-3 text-sm font-semibold border-b border-white/10">{title}</p>
            <div className="overflow-x-auto">{children}</div>
        </div>
    )
}

function Chip({ children }: { children: React.ReactNode }) {
    return <span className="bg-white/10 text-white/70 rounded-full px-2.5 py-1">{children}</span>
}

function Badge({ method, amount, code }: { method: 'money' | 'coupon' | 'unknown'; amount: number; code?: string }) {
    if (method === 'money') return <span className="shrink-0 bg-green-400/15 text-green-300 rounded-full px-2.5 py-1 text-xs">Paid · {kes(amount)}</span>
    if (method === 'coupon') return <span className="shrink-0 bg-amber-400/15 text-amber-300 rounded-full px-2.5 py-1 text-xs">Coupon{code ? ` · ${code}` : ''}</span>
    return <span className="shrink-0 bg-white/10 text-white/50 rounded-full px-2.5 py-1 text-xs">Unknown</span>
}

function Table({ head, rows, alignRight = [], mono = [], boldLastRow }: {
    head: string[]
    rows: (string | number)[][]
    alignRight?: number[]
    mono?: number[]
    boldLastRow?: boolean
}) {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-white/40 text-[11px] uppercase tracking-wider">
                    {head.map((h, i) => (
                        <th key={i} className={`px-4 py-2.5 font-medium ${alignRight.includes(i) ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((r, ri) => (
                    <tr key={ri} className={`border-t border-white/5 ${boldLastRow && ri === rows.length - 1 ? 'font-semibold text-white' : 'text-white/75'}`}>
                        {r.map((cell, ci) => (
                            <td key={ci} className={`px-4 py-2.5 ${alignRight.includes(ci) ? 'text-right' : 'text-left'} ${mono.includes(ci) ? 'font-mono text-xs' : ''}`}>{cell}</td>
                        ))}
                    </tr>
                ))}
                {rows.length === 0 && (
                    <tr><td colSpan={head.length} className="px-4 py-8 text-center text-white/40">No data yet.</td></tr>
                )}
            </tbody>
        </table>
    )
}
