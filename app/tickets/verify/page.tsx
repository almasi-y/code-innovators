'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyTicketPayment } from '@/app/actions/paystack'

export default function VerifyPage({
    searchParams,
}: {
    searchParams: Promise<{ reference?: string }>
}) {
    const { reference } = use(searchParams)
    const router = useRouter()
    const [message, setMessage] = useState('Verifying your payment…')
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (!reference) {
            router.replace('/tickets')
            return
        }

        verifyTicketPayment(reference).then((result) => {
            if (result.success && result.ticketId && result.token) {
                setMessage('Payment confirmed! Loading your ticket…')
                router.replace(`/tickets/${result.ticketId}?token=${result.token}`)
            } else {
                setMessage(result.error ?? 'Payment verification failed.')
                setFailed(true)
            }
        })
    }, [reference, router])

    return (
        <div className="bg-background min-h-screen flex items-center justify-center px-4">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                {!failed ? (
                    <>
                        <svg className="animate-spin w-10 h-10 text-[#8b7ff5]" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
                        </svg>
                        <p className="text-white font-display text-lg">{message}</p>
                        <p className="text-white/40 text-sm">Please don&apos;t close this tab.</p>
                    </>
                ) : (
                    <>
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-white font-display text-lg">{message}</p>
                        <p className="text-white/40 text-sm">
                            If you were charged, your ticket may still be processing. Check your email or{' '}
                            <a href="/tickets" className="text-[#8b7ff5] underline underline-offset-2">try again</a>.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
