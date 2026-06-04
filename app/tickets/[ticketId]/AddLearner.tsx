'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addLearnerToTeam } from '@/app/actions/addLearner'

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!

type PaystackSetup = {
    setup(config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        metadata?: Record<string, unknown>
        callback: (r: { reference: string }) => void
        onClose: () => void
    }): { openIframe(): void }
}

export default function AddLearner({
    ticketId,
    token,
    email,
    teamName,
    currentCount,
    maxLearners,
    feeKes,
}: {
    ticketId: string
    token: string
    email: string
    teamName?: string
    currentCount: number
    maxLearners: number
    feeKes: number
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const slotsLeft = Math.max(0, maxLearners - currentCount)
    const full = slotsLeft <= 0

    function handleAdd() {
        setError(null)
        const trimmed = name.trim()
        if (!trimmed) {
            setError('Enter the learner’s full name.')
            return
        }
        const PaystackPop = (window as unknown as { PaystackPop?: PaystackSetup }).PaystackPop
        if (!PaystackPop) {
            setError('Payment widget still loading — try again in a moment.')
            return
        }

        const bytes = new Uint8Array(12)
        crypto.getRandomValues(bytes)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const rand = Array.from(bytes).map((b) => chars[b % chars.length]).join('')

        PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email,
            amount: feeKes * 100,
            currency: 'KES',
            ref: `ADD-${rand}`,
            metadata: { ticketId, learnerName: trimmed, kind: 'add-learner' },
            callback(response) {
                setLoading(true)
                addLearnerToTeam({
                    ticketId,
                    token,
                    learnerName: trimmed,
                    paystackReference: response.reference,
                }).then((result) => {
                    if (result.success) {
                        setDone(true)
                        setName('')
                        router.refresh()
                    } else {
                        setError(result.error ?? 'Something went wrong.')
                    }
                    setLoading(false)
                })
            },
            onClose() {},
        }).openIframe()
    }

    if (full) {
        return (
            <p className="text-white/35 text-xs text-center">
                This team is full ({maxLearners} learners — the maximum for its category).
            </p>
        )
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-semibold px-6 py-3 rounded-full text-sm transition-all"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add a learner to {teamName || 'this team'}
            </button>
        )
    }

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-white text-sm font-semibold">Add a learner</p>
                <span className="text-white/40 text-xs">{slotsLeft} slot{slotsLeft === 1 ? '' : 's'} left</span>
            </div>

            {done && (
                <p className="text-green-300 text-xs bg-green-400/10 rounded-lg px-3 py-2">
                    ✓ Learner added. You can add another or close.
                </p>
            )}

            <input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); setDone(false) }}
                placeholder="Learner full name"
                suppressHydrationWarning
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#8b7ff5] disabled:opacity-50"
            />

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex gap-2">
                <button
                    onClick={handleAdd}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-full text-sm transition-colors"
                >
                    {loading ? 'Saving…' : `Pay KES ${feeKes.toLocaleString()} & add`}
                </button>
                <button
                    onClick={() => { setOpen(false); setName(''); setError(null); setDone(false) }}
                    disabled={loading}
                    className="text-white/50 hover:text-white text-sm px-4 py-3 transition-colors disabled:opacity-50"
                >
                    Close
                </button>
            </div>
            <p className="text-white/30 text-[11px] text-center">
                The new learner is added only after payment is confirmed.
            </p>
        </div>
    )
}
