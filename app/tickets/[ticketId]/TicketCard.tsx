'use client'

import { useState } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import type { TicketData } from './page'
import { learnerLimit } from '@/lib/registrationLimits'
import AddLearner from './AddLearner'

const EVENT_DATE     = '13 June 2027'
const EVENT_TIME     = '09:00 AM'
const EVENT_LOCATION = 'Khadija Comprehensive'

export default function TicketCard({ ticket, baseUrl, token, feeKes }: { ticket: TicketData; baseUrl: string; token: string; feeKes: number }) {
    const [downloading, setDownloading] = useState(false)
    const ticketUrl = `${baseUrl}/check-in/${ticket.ticketId}?token=${encodeURIComponent(token)}`
    const cardId = `printable-ticket-${ticket.ticketId}`

    async function handleDownload() {
        setDownloading(true)
        try {
            const element = document.getElementById(cardId)
            if (!element) return

            const [{ toPng }, { default: jsPDF }] = await Promise.all([
                import('html-to-image'),
                import('jspdf'),
            ])

            const dataUrl = await toPng(element, { pixelRatio: 3, cacheBust: true })
            const widthMm  = (element.offsetWidth  * 25.4) / 96
            const heightMm = (element.offsetHeight * 25.4) / 96

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [widthMm, heightMm] })
            pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm)
            pdf.save(`ticket-${ticket.ticketId}.pdf`)
        } finally {
            setDownloading(false)
        }
    }

    const teamLabel = ticket.teamNumber && ticket.totalTeams && ticket.totalTeams > 1
        ? `Team ${ticket.teamNumber} of ${ticket.totalTeams}`
        : ticket.teamNumber ? `Team ${ticket.teamNumber}` : null

    return (
        <div className="flex flex-col items-center gap-6">

            {/* ── Ticket card ── */}
            <div
                id={cardId}
                className="w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
            >
                {/* Header band */}
                <div className="bg-[#8b7ff5] px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-white text-sm font-bold uppercase tracking-widest">Code Innovators Festival</p>
                            <p className="text-white/90 font-display font-semibold text-base leading-tight mt-0.5">
                                {ticket.teamName ?? 'School Pass'}
                            </p>
                        </div>
                        {teamLabel && (
                            <span className="shrink-0 bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mt-0.5">
                                {teamLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* QR + Details */}
                <div className="flex gap-4 px-5 pt-5 pb-4">
                    <div className="flex-shrink-0 bg-white p-2 rounded-xl self-start">
                        <QRCodeSVG value={ticketUrl} size={130} level="M" bgColor="#ffffff" fgColor="#1a1a2e" />
                    </div>

                    <div className="flex flex-col gap-2 min-w-0">
                        <div>
                            <p className="text-white/40 text-[9px] uppercase tracking-widest">Contact</p>
                            <p className="text-white text-xs font-medium truncate">{ticket.customerName}</p>
                        </div>
                        <div>
                            <p className="text-white/40 text-[9px] uppercase tracking-widest">School</p>
                            <p className="text-white text-xs font-medium truncate">{ticket.schoolName || '—'}</p>
                        </div>
                        {ticket.category && (
                            <div>
                                <p className="text-white/40 text-[9px] uppercase tracking-widest">Category</p>
                                <p className="text-white text-xs font-medium leading-tight">{ticket.category}</p>
                            </div>
                        )}
                        {ticket.thematicArea && (
                            <div>
                                <p className="text-white/40 text-[9px] uppercase tracking-widest">Domain</p>
                                <p className="text-white text-xs font-medium">{ticket.thematicArea}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <div>
                                <p className="text-white/40 text-[9px] uppercase tracking-widest">Date</p>
                                <p className="text-white text-xs font-medium">{EVENT_DATE}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-[9px] uppercase tracking-widest">Time</p>
                                <p className="text-white text-xs font-medium">{EVENT_TIME}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Perforation */}
                <div className="flex items-center mx-0 my-1">
                    <div className="w-5 h-5 rounded-full bg-[#2e2e2e] -ml-2.5 flex-shrink-0" />
                    <div className="flex-1 border-t-2 border-dashed border-white/15" />
                    <div className="w-5 h-5 rounded-full bg-[#2e2e2e] -mr-2.5 flex-shrink-0" />
                </div>

                {/* Bottom strip */}
                <div className="px-5 pt-3 pb-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-white/40 text-[9px] uppercase tracking-widest">Ticket ID</p>
                            <p className="text-white font-mono text-sm font-semibold tracking-wider">{ticket.ticketId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-[9px] uppercase tracking-widest">Venue</p>
                            <p className="text-white text-xs font-medium">{EVENT_LOCATION}</p>
                        </div>
                    </div>
                    <div className="flex justify-center pt-1">
                        <Image src="/logo.svg" alt="Code Innovators" width={80} height={26} className="opacity-50" />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full max-w-sm">
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-full text-sm transition-all duration-200 shadow-lg shadow-[#8b7ff5]/20"
                >
                    {downloading ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
                            </svg>
                            Generating…
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download PDF
                        </>
                    )}
                </button>
                <a href="/register"
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-semibold px-6 py-3 rounded-full text-sm transition-all">
                    Register Another
                </a>
            </div>

            {/* Add a learner to this team (charged per learner) */}
            {ticket.category && (
                <div className="w-full max-w-sm">
                    <AddLearner
                        ticketId={ticket.ticketId}
                        token={token}
                        email={ticket.email}
                        teamName={ticket.teamName}
                        currentCount={(ticket.learnerNames ?? []).filter((n) => n.trim()).length}
                        maxLearners={learnerLimit(ticket.category).max}
                        feeKes={feeKes}
                    />
                </div>
            )}
        </div>
    )
}
