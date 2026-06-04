import { notFound } from 'next/navigation'
import Script from 'next/script'
import { client } from '@/sanity/lib/client'
import { verifyTicketToken, signTicketId } from '@/lib/ticket-token'
import { getRegistrationFee } from '@/lib/registrationFee'
import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'
import TicketCard from './TicketCard'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.codeinnovators.africa'
const TICKET_ID_PATTERN = /^CI-[A-Z0-9]{8}$/

export interface TicketData {
    ticketId: string
    customerName: string
    email: string
    schoolName: string
    ticketType: string
    status: string
    issuedAt: string
    registrationId?: string
    teamName?: string
    teamNumber?: number
    totalTeams?: number
    category?: string
    thematicArea?: string
    learnerNames?: string[]
}

async function getTicket(ticketId: string): Promise<TicketData | null> {
    return client.fetch<TicketData | null>(
        `*[_type == "ticket" && ticketId == $id][0]{
            ticketId, customerName, email, schoolName, ticketType, status, issuedAt,
            registrationId, teamName, teamNumber, totalTeams, category, thematicArea, learnerNames
        }`,
        { id: ticketId },
        { cache: 'no-store' }
    )
}

async function getSiblingTickets(registrationId: string, excludeTicketId: string): Promise<TicketData[]> {
    return client.fetch<TicketData[]>(
        `*[_type == "ticket" && registrationId == $rid && ticketId != $excl && status == "paid"] | order(teamNumber asc) {
            ticketId, customerName, email, schoolName, ticketType, status, issuedAt,
            registrationId, teamName, teamNumber, totalTeams, category, thematicArea, learnerNames
        }`,
        { rid: registrationId, excl: excludeTicketId },
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

    if (!TICKET_ID_PATTERN.test(ticketId)) notFound()

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

    // Fetch sibling tickets from the same registration (server-side token generation is safe
    // because the caller has already proven ownership via the primary ticket token)
    const siblings = ticket.registrationId
        ? await getSiblingTickets(ticket.registrationId, ticketId)
        : []

    const allTickets = [
        { ticket, token },
        ...siblings.map(t => ({ ticket: t, token: signTicketId(t.ticketId) })),
    ]

    const feeKes = await getRegistrationFee()
    const plural = allTickets.length > 1

    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 px-4 sm:px-6 md:px-12 lg:px-16 pt-24 sm:pt-28 pb-24">
                <div className="mb-10">
                    <span className="text-white/50 text-xs sm:text-sm uppercase tracking-widest mb-4 block">
                        {plural ? `${allTickets.length} Tickets` : 'Your Ticket'}
                    </span>
                    <h1 className="font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1] tracking-tight text-white">
                        You&apos;re in!
                    </h1>
                    <p className="mt-3 text-white/50 text-sm max-w-sm">
                        {plural
                            ? `You have ${allTickets.length} tickets — one per team. Download and present each one at the event.`
                            : 'Your ticket is confirmed. Download it — you\'ll need to present it at the event.'}
                    </p>
                </div>

                <div className={`${plural ? 'flex flex-wrap gap-8' : ''}`}>
                    {allTickets.map(({ ticket: t, token: tok }) => (
                        <TicketCard key={t.ticketId} ticket={t} baseUrl={BASE_URL} token={tok} feeKes={feeKes} />
                    ))}
                </div>
            </main>
            <Footer />
            <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
        </div>
    )
}
