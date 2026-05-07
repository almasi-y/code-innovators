'use client'

import Link from 'next/link'
import { GlowingEffect } from '@/components/ui/glowing-effect'

function ArrowIcon({ color }: { color: string }) {
    return (
        <div
            className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-3 sm:p-4 transition-all duration-500 ease-in-out group-hover:scale-110"
            style={{ backgroundColor: color }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
                aria-hidden="true"
            >
                <path d="M4 20L20 4" />
                <path d="M4 4h16v16" />
            </svg>
        </div>
    )
}

function SponsorCard({
    href,
    hoverBg,
    hoverBorder,
    title,
    description,
    arrowColor,
    textOnHover = 'white',
}: {
    href: string
    hoverBg: string
    hoverBorder: string
    title: React.ReactNode
    description: string
    arrowColor: string
    textOnHover?: 'white' | 'black'
}) {
    const hoverText = textOnHover === 'black' ? 'group-hover:text-black' : ''
    const hoverDesc = textOnHover === 'black' ? 'group-hover:text-black/60' : 'group-hover:text-white/80'

    return (
        <li className="list-none">
            <div className="relative h-full rounded-[3rem] p-px">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                />
                <Link
                    href={href}
                    className={`group relative block h-full rounded-[3rem] overflow-hidden bg-white/5 border border-white/30 p-7 sm:p-9 pb-24 sm:pb-28 transition-all duration-300`}
                    onMouseEnter={(e) => {
                        const el = e.currentTarget
                        el.style.backgroundColor = hoverBg
                        el.style.borderColor = hoverBorder
                    }}
                    onMouseLeave={(e) => {
                        const el = e.currentTarget
                        el.style.backgroundColor = ''
                        el.style.borderColor = ''
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <h2 className={`font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight transition-colors duration-300 ${hoverText}`}>
                            {title}
                        </h2>
                        <p className={`text-white/50 text-sm leading-relaxed transition-colors duration-300 ${hoverDesc}`}>
                            {description}
                        </p>
                    </div>
                    <div className="absolute bottom-6 right-6">
                        <ArrowIcon color={arrowColor} />
                    </div>
                </Link>
            </div>
        </li>
    )
}

export default function SponsorCTA() {
    return (
        <section className="relative z-10 bg-background px-4 sm:px-6 md:px-12 lg:px-16 py-20 md:py-28" style={{transform:'translateZ(0)'}}>
            {/* Heading pill */}
            <div className="mb-10">
                <span className="inline-block border border-white/20 text-white font-display font-semibold text-2xl sm:text-3xl md:text-4xl px-6 py-3 rounded-full">
                    Ready To Make An Impact
                </span>
            </div>

            {/* Cards */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SponsorCard
                    href="/sponsor"
                    hoverBg="#8b7ff5"
                    hoverBorder="#8b7ff5"
                    title={<>Become a<br />Sponsor</>}
                    description="Partner with us to empower the next generation of African tech innovators."
                    arrowColor="#8b7ff5"
                />
                <SponsorCard
                    href="/sponsorship-packages"
                    hoverBg="#00e6b4"
                    hoverBorder="#00e6b4"
                    title={<>See Sponsorship<br />Packages</>}
                    description="Explore our tiers and find the right level of partnership for your organisation."
                    arrowColor="#00e6b4"
                    textOnHover="black"
                />
            </ul>
        </section>
    )
}
