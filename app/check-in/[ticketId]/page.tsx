'use client'

import { use, useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { getTicketForCheckIn, checkInTicket, type TicketCheckInResult } from '@/app/actions/checkIn'

const PIN_KEY = 'ci_admin_pin'

type Phase = 'pin' | 'result'

export default function CheckInPage({
    params,
    searchParams,
}: {
    params: Promise<{ ticketId: string }>
    searchParams: Promise<{ token?: string }>
}) {
    const { ticketId } = use(params)
    const { token = '' } = use(searchParams)

    const [phase, setPhase] = useState<Phase>('pin')
    const [pin, setPin] = useState('')
    const [pinError, setPinError] = useState('')
    const [result, setResult] = useState<TicketCheckInResult | null>(null)
    const [checkedIn, setCheckedIn] = useState(false)
    const [checkInError, setCheckInError] = useState('')
    const [isPending, startTransition] = useTransition()

    // Restore cached PIN so admins don't re-enter for every scan
    useEffect(() => {
        const saved = sessionStorage.getItem(PIN_KEY)
        if (saved) {
            setPin(saved)
            startTransition(async () => {
                const r = await getTicketForCheckIn(ticketId, token, saved)
                if (r.status !== 'invalid_pin') {
                    setResult(r)
                    setPhase('result')
                } else {
                    sessionStorage.removeItem(PIN_KEY)
                }
            })
        }
    }, [ticketId, token])

    function handlePinSubmit(e: React.FormEvent) {
        e.preventDefault()
        setPinError('')
        startTransition(async () => {
            const r = await getTicketForCheckIn(ticketId, token, pin)
            if (r.status === 'invalid_pin') {
                setPinError('Incorrect PIN. Try again.')
                return
            }
            sessionStorage.setItem(PIN_KEY, pin)
            setResult(r)
            setPhase('result')
        })
    }

    function handleCheckIn() {
        setCheckInError('')
        startTransition(async () => {
            const r = await checkInTicket(ticketId, token, pin)
            if (r.success) {
                setCheckedIn(true)
                const updated = await getTicketForCheckIn(ticketId, token, pin)
                setResult(updated)
            } else {
                setCheckInError(r.error ?? 'Check-in failed.')
            }
        })
    }

    // ── PIN screen ──────────────────────────────────────────────
    if (phase === 'pin') {
        return (
            <div className="h-dvh bg-[#0f0f1a] flex flex-col items-center justify-center p-6 overflow-hidden">
                <Image src="/logo.svg" alt="Code Innovators" width={90} height={30} className="mb-6 opacity-80" />
                <div className="w-full max-w-xs bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h1 className="text-white font-bold text-lg text-center mb-1">Admin Check-In</h1>
                    <p className="text-white/40 text-xs text-center mb-5">Enter your PIN to verify this ticket</p>
                    <form onSubmit={handlePinSubmit} className="flex flex-col gap-3">
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={8}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="PIN"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder:text-white/20 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-[#8b7ff5]"
                            autoFocus
                        />
                        {pinError && <p className="text-red-400 text-xs text-center">{pinError}</p>}
                        <button
                            type="submit"
                            disabled={isPending || !pin}
                            className="w-full bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            {isPending ? 'Verifying…' : 'Verify'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // ── Result screen ────────────────────────────────────────────
    const isAlreadyIn = result?.status === 'already_checked_in' || (result?.status === 'valid' && checkedIn)
    const isInvalid = !result || result.status === 'invalid_ticket' || result.status === 'not_paid'

    const bgColor = isInvalid ? 'bg-[#1a1a2e]' : isAlreadyIn ? 'bg-red-950' : 'bg-green-950'
    const borderColor = isInvalid ? 'border-white/10' : isAlreadyIn ? 'border-red-500/40' : 'border-green-500/40'
    const statusLabel = isInvalid
        ? (result?.status === 'not_paid' ? 'NOT PAID' : 'INVALID')
        : isAlreadyIn ? 'ALREADY CHECKED IN' : 'VALID'
    const statusColor = isInvalid ? 'text-white/60' : isAlreadyIn ? 'text-red-400' : 'text-green-400'
    const iconBg = isInvalid ? 'bg-white/10' : isAlreadyIn ? 'bg-red-500/20' : 'bg-green-500/20'

    return (
        <div className="h-dvh bg-[#0f0f1a] flex flex-col items-center justify-center p-6 overflow-hidden">
            <Image src="/logo.svg" alt="Code Innovators" width={90} height={30} className="mb-6 opacity-80" />

            <div className={`w-full max-w-xs ${bgColor} border ${borderColor} rounded-2xl p-5 shadow-xl flex flex-col items-center gap-3`}>

                {/* Status icon */}
                <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center`}>
                    {isInvalid ? (
                        <svg className="w-7 h-7 text-white/40" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : isAlreadyIn ? (
                        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                    ) : (
                        <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    )}
                </div>

                {/* Status label */}
                <p className={`font-black text-xl tracking-widest uppercase ${statusColor}`}>{statusLabel}</p>

                {/* Ticket details */}
                {result && result.status !== 'invalid_ticket' && (
                    <div className="w-full bg-black/20 rounded-xl p-3 flex flex-col gap-2">
                        {'customerName' in result && (
                            <>
                                <Row label="Name" value={result.customerName} />
                                <Row label="School" value={result.schoolName} />
                            </>
                        )}
                        {'ticketType' in result && <Row label="Type" value={result.ticketType} />}
                        <Row label="Ticket ID" value={ticketId} mono />
                        {result.status === 'already_checked_in' && result.checkedInAt && (
                            <Row label="Checked in at" value={new Date(result.checkedInAt).toLocaleTimeString()} />
                        )}
                        {checkedIn && result.status !== 'already_checked_in' && (
                            <Row label="Checked in at" value={new Date().toLocaleTimeString()} />
                        )}
                    </div>
                )}

                {result?.status === 'not_paid' && (
                    <p className="text-white/50 text-xs text-center">This ticket has not been paid for.</p>
                )}

                {/* Check-in button */}
                {result?.status === 'valid' && !checkedIn && (
                    <>
                        {checkInError && <p className="text-red-400 text-xs">{checkInError}</p>}
                        <button
                            onClick={handleCheckIn}
                            disabled={isPending}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-base"
                        >
                            {isPending ? 'Checking in…' : 'Check In'}
                        </button>
                    </>
                )}

                {/* Back link */}
                <button
                    onClick={() => {
                        setResult(null)
                        setPhase('pin')
                        setCheckedIn(false)
                        setCheckInError('')
                    }}
                    className="text-white/30 hover:text-white/60 text-xs transition-colors"
                >
                    ← Back / Scan Another
                </button>
            </div>
        </div>
    )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between items-start gap-2">
            <span className="text-white/40 text-xs uppercase tracking-wider shrink-0">{label}</span>
            <span className={`text-white text-xs font-medium text-right ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</span>
        </div>
    )
}
