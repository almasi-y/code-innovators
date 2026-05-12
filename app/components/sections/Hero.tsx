"use client"

import Image from 'next/image'
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect'

interface HeroProps {
    title: string
    eventDate: string
    location: string
    format: string
    backgroundImage: string | null
    primaryCta?: string
    secondaryCta?: string
}

export default function Hero({
    title,
    eventDate,
    location,
    format,
    backgroundImage,
}: HeroProps) {
    return (
        <section className="relative min-h-[100dvh] w-full overflow-hidden">
            {/* Background image — absolute so it scrolls out of view as the user scrolls */}
            {backgroundImage ? (
                <div className="absolute inset-0 -z-10">
                    <Image
                        src={backgroundImage}
                        alt={title}
                        fill
                        className="object-cover"
                        priority
                        quality={90}
                        sizes="100vw"
                    />
                    {/* Purple tint overlay */}
                    <div className="absolute inset-0 bg-overlay-purple" />
                </div>
            ) : (
                /* Fallback gradient when no image is set yet */
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#222222] via-[#1a1a1a] to-background" />
                    <div className="absolute inset-0 bg-black/30" />
                </div>
            )}

            {/* Hero Content — Bottom-left aligned */}
            <div className="relative z-10 flex flex-col justify-end min-h-[100dvh] pb-24 sm:pb-32 lg:pb-10 px-4 sm:px-6 md:px-12 lg:px-16">
                <div className="w-full">
                    {/* Typewriter title — two lines like the original layout */}
                    {(() => {
                        const allWords = title.trim().split(' ')
                        const lastWord = allWords.pop()!
                        return (
                            <div className="mb-6 sm:mb-8">
                                {/* Line 1: "Code Innovators" */}
                                <TypewriterEffectSmooth
                                    words={allWords.map((word) => ({
                                        text: word,
                                        className: 'text-white dark:text-white',
                                    }))}
                                    className="font-display"
                                    cursorClassName="hidden"
                                />
                                {/* Line 2: "Festival" */}
                                <TypewriterEffectSmooth
                                    words={[{
                                        text: lastWord,
                                        className: 'text-white dark:text-white',
                                    }]}
                                    className="font-display"
                                    cursorClassName="bg-purple-500"
                                />
                            </div>
                        )
                    })()}

                    {/* Pills — stacked rows like reference: date on first row, location + format below */}
                    <div className="flex flex-col gap-3">
                        {/* Mobile: each pill full-width stacked | Desktop: row 1 date+location, row 2 format */}
                        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
                            <span className="bg-[#8b7ff5] text-white font-bold text-center
                                w-full md:w-auto
                                px-6 py-4 md:px-10 md:py-6
                                rounded-full md:rounded-3xl
                                text-[22px] md:text-2xl lg:text-4xl
                                shadow-lg shadow-[#8b7ff5]/25 whitespace-nowrap">
                                {eventDate}
                            </span>
                            <span className="border border-pill-border text-white font-semibold text-center
                                w-full md:w-auto
                                px-6 py-4 md:px-10 md:py-6
                                rounded-full md:rounded-3xl
                                text-[22px] md:text-2xl lg:text-4xl
                                backdrop-blur-sm whitespace-nowrap">
                                {location}
                            </span>
                        </div>
                        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
                            <span className="border border-pill-border text-white font-semibold text-center
                                w-full md:w-auto
                                px-6 py-4 md:px-10 md:py-6
                                rounded-full md:rounded-3xl
                                text-[22px] md:text-2xl lg:text-4xl
                                backdrop-blur-sm whitespace-nowrap">
                                {format}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom fade into next section */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>
    )
}
