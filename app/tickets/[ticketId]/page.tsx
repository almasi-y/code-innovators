import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { verifyTicketToken } from '@/lib/ticket-token'
import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'
import TicketCard from './TicketCard'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://code-innovators-rho.vercel.app'
const TICKET_ID_PATTERN = /^CI-[A-Z0-9]{8}$/

async function getTicket(ticketId: string) {
    return client.fetch<{
        ticketId: string
        customerName: string
        email: string
        schoolName: string
        ticketType: string
        status: string
        issuedAt: string
    } | null>(
        `*[_type == "ticket" && ticketId == $id][0]{
            ticketId, customerName, email, schoolName, ticketType, status, issuedAt
        }`,
        { id: ticketId },
        { cache: 'no-store' }
    )
}

export default async function TicketPage({
    params,
    searchParams,
}: {
    params: Promise<{ ticketId: string }>
    searchParams: Promise<{ token?: string }>
}) {
    const { ticketId } = await params
    const { token } = await searchParams

    // 1. Validate ticket ID format before hitting the database
    if (!TICKET_ID_PATTERN.test(ticketId)) notFound()

    // 2. Verify the signed token — prevents IDOR (viewing other people's tickets)
    if (!token || !verifyTicketToken(ticketId, token)) {
        return (
            <div className="bg-background min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-white font-display text-xl">Access Denied</p>
                        <p className="text-white/50 text-sm">This ticket link is invalid or has expired. Use the original link from your registration.</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const ticket = await getTicket(ticketId)
    if (!ticket) notFound()

    if (ticket.status === 'pending') {
        return (
            <div className="bg-background min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <svg className="animate-spin w-10 h-10 text-[#8b7ff5]" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
                        </svg>
                        <p className="text-white font-display text-xl">Payment processing…</p>
                        <p className="text-white/40 text-sm">Your payment is being confirmed. This page will update automatically.</p>
                        <meta httpEquiv="refresh" content="5" />
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (ticket.status === 'failed') {
        return (
            <div className="bg-background min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-white font-display text-xl">Payment Failed</p>
                        <p className="text-white/40 text-sm">This ticket&apos;s payment did not complete. Please try again.</p>
                        <a href="/tickets" className="bg-[#8b7ff5] hover:bg-[#7a6ee0] text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors">
                            Try Again
                        </a>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 px-4 sm:px-6 md:px-12 lg:px-16 pt-24 sm:pt-28 pb-24">
                <div className="mb-10">
                    <span className="text-white/50 text-xs sm:text-sm uppercase tracking-widest mb-4 block">
                        Your Ticket
                    </span>
                    <h1 className="font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1] tracking-tight text-white">
                        You&apos;re in!
                    </h1>
                    <p className="mt-3 text-white/50 text-sm max-w-sm">
                        Your ticket is confirmed. Download it — you&apos;ll need to present it at the event.
                    </p>
                </div>
                <TicketCard ticket={ticket} baseUrl={BASE_URL} token={token} />
            </main>
            <Footer />
        </div>
    )
}
