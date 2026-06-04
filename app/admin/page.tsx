'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { listSchools, type AdminSchool } from '@/app/actions/admin'

const PIN_KEY = 'ci_admin_pin'

export default function AdminPage() {
    const [pin, setPin] = useState('')
    const [pinError, setPinError] = useState('')
    const [schools, setSchools] = useState<AdminSchool[] | null>(null)
    const [query, setQuery] = useState('')
    const [copied, setCopied] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [autoChecking, setAutoChecking] = useState(false)

    // Reuse the cached check-in PIN so you don't re-enter it.
    useEffect(() => {
        const saved = sessionStorage.getItem(PIN_KEY)
        if (!saved) return
        setPin(saved)
        setAutoChecking(true)
        listSchools(saved)
            .then((r) => {
                if (r.ok) setSchools(r.schools)
                else sessionStorage.removeItem(PIN_KEY)
            })
            .finally(() => setAutoChecking(false))
    }, [])

    function handlePinSubmit(e: React.FormEvent) {
        e.preventDefault()
        setPinError('')
        startTransition(async () => {
            const r = await listSchools(pin)
            if (!r.ok) {
                setPinError('Incorrect PIN. Try again.')
                return
            }
            sessionStorage.setItem(PIN_KEY, pin)
            setSchools(r.schools)
        })
    }

    function refresh() {
        startTransition(async () => {
            const r = await listSchools(pin)
            if (r.ok) setSchools(r.schools)
        })
    }

    async function copyLink(school: AdminSchool) {
        if (!school.ticketLink) return
        try {
            await navigator.clipboard.writeText(school.ticketLink)
            setCopied(school.registrationId)
            setTimeout(() => setCopied(null), 1800)
        } catch {
            // Clipboard blocked — select fallback
            window.prompt('Copy this link:', school.ticketLink)
        }
    }

    const filtered = useMemo(() => {
        if (!schools) return []
        const q = query.trim().toLowerCase()
        if (!q) return schools
        return schools.filter(
            (s) =>
                s.schoolName?.toLowerCase().includes(q) ||
                s.contactPerson?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q)
        )
    }, [schools, query])

    // ── PIN screen ──────────────────────────────────────────────
    if (!schools) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <form onSubmit={handlePinSubmit} className="w-full max-w-xs">
                    <p className="text-white font-display text-2xl text-center mb-1">Organizer Admin</p>
                    <p className="text-white/40 text-xs text-center mb-5">Enter your PIN to view all schools</p>
                    <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="PIN"
                        autoFocus
                        suppressHydrationWarning
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-[0.3em] placeholder:tracking-normal focus:outline-none focus:border-[#8b7ff5]"
                    />
                    {pinError && <p className="text-red-400 text-xs text-center mt-3">{pinError}</p>}
                    {autoChecking && <p className="text-white/30 text-xs text-center mt-3">Checking saved PIN…</p>}
                    <button
                        type="submit"
                        disabled={isPending || !pin}
                        className="w-full mt-4 bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors"
                    >
                        {isPending ? 'Checking…' : 'Unlock'}
                    </button>
                </form>
            </div>
        )
    }

    // ── School list ─────────────────────────────────────────────
    const moneyCount = schools.filter((s) => s.paymentMethod === 'money').length
    const couponCount = schools.filter((s) => s.paymentMethod === 'coupon').length

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 md:px-10 py-10">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                    <div>
                        <h1 className="text-white font-display text-3xl">Schools</h1>
                        <p className="text-white/40 text-sm mt-1">
                            {schools.length} registered · {moneyCount} paid (money) · {couponCount} coupon
                        </p>
                    </div>
                    <button
                        onClick={refresh}
                        disabled={isPending}
                        className="text-white/60 hover:text-white text-sm border border-white/15 rounded-full px-4 py-2 transition-colors disabled:opacity-40"
                    >
                        {isPending ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>

                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search school, contact or email…"
                    suppressHydrationWarning
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#8b7ff5] mb-6"
                />

                <div className="flex flex-col gap-3">
                    {filtered.map((s) => (
                        <div
                            key={s.registrationId}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0">
                                    <p className="text-white font-semibold text-lg leading-tight">{s.schoolName}</p>
                                    <p className="text-white/50 text-sm">
                                        {s.contactPerson} · {s.email}
                                        {s.phone ? ` · ${s.phone}` : ''}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                        <span className="bg-white/10 text-white/70 rounded-full px-2.5 py-1">
                                            {s.teams.length} {s.teams.length === 1 ? 'team' : 'teams'}
                                        </span>
                                        <span className="bg-white/10 text-white/70 rounded-full px-2.5 py-1">
                                            {s.totalLearners ?? 0} learners
                                        </span>
                                        {(s.observerNames?.length ?? 0) > 0 && (
                                            <span className="bg-white/10 text-white/70 rounded-full px-2.5 py-1">
                                                {s.observerNames!.length} observers
                                            </span>
                                        )}
                                        {s.paymentMethod === 'coupon' ? (
                                            <span className="bg-amber-400/15 text-amber-300 rounded-full px-2.5 py-1">
                                                Coupon {s.couponCode ? `· ${s.couponCode}` : ''}
                                            </span>
                                        ) : s.paymentMethod === 'money' ? (
                                            <span className="bg-green-400/15 text-green-300 rounded-full px-2.5 py-1">
                                                Paid · KES {(s.totalAmountKes ?? 0).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="bg-white/10 text-white/50 rounded-full px-2.5 py-1">
                                                Unknown
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Teams */}
                            <div className="mt-3 flex flex-col gap-1.5">
                                {s.teams.map((t, i) => (
                                    <p key={i} className="text-white/45 text-xs">
                                        <span className="text-white/70">{t.teamName || `Team ${i + 1}`}</span>
                                        {t.category ? ` — ${t.category}` : ''}
                                        {t.learnerNames?.length ? ` · ${t.learnerNames.filter(Boolean).join(', ')}` : ''}
                                    </p>
                                ))}
                            </div>

                            {/* Link actions */}
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                {s.ticketLink ? (
                                    <>
                                        <button
                                            onClick={() => copyLink(s)}
                                            className="bg-[#8b7ff5] hover:bg-[#7a6ee0] text-white text-sm font-semibold rounded-full px-4 py-2 transition-colors"
                                        >
                                            {copied === s.registrationId ? '✓ Copied' : 'Copy ticket link'}
                                        </button>
                                        <a
                                            href={s.ticketLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/60 hover:text-white text-sm border border-white/15 rounded-full px-4 py-2 transition-colors"
                                        >
                                            Open
                                        </a>
                                    </>
                                ) : (
                                    <span className="text-red-400/70 text-xs">No paid ticket found for this school.</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <p className="text-white/40 text-sm text-center py-10">No schools match “{query}”.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
