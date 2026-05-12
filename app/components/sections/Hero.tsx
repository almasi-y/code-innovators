"use client"

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect'

interface HeroProps {
    title: string
    eventDate: string
    location: string
    format: string
    backgroundImages: string[]
    primaryCta?: string
    secondaryCta?: string
}

export default function Hero({
    title,
    eventDate,
    location,
    format,
    backgroundImages,
}: HeroProps) {
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (backgroundImages.length < 2) return
        const id = setInterval(() => {
            setCurrent(i => (i + 1) % backgroundImages.length)
        }, 3000)
        return () => clearInterval(id)
    }, [backgroundImages.length])

    return (
        <section className="relative min-h-[100dvh] w-full overflow-hidden">
            {/* Background images — crossfade slideshow */}
            {backgroundImages.length > 0 ? (
                <div className="absolute inset-0 -z-10">
                    {backgroundImages.map((src, i) => (
                        <div
                            key={src}
                            className="absolute inset-0 transition-opacity duration-1000"
                            style={{ opacity: i === current ? 1 : 0 }}
                        >
                            <Image
                                src={`${src}?w=1920&auto=format&fit=max&q=80`}
                                alt={title}
                                fill
                                className="object-cover"
                                priority={i === 0}
                                quality={90}
                                sizes="100vw"
                                unoptimized
                            />
                        </div>
                    ))}
                    <div className="absolute inset-0 bg-overlay-purple" />
                </div>
            ) : (
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#222222] via-[#1a1a1a] to-background" />
                    <div className="absolute inset-0 bg-black/30" />
                </div>
            )}

            {/* Hero Content — Bottom-left aligned */}
            <div className="relative z-10 flex flex-col justify-end min-h-[100dvh] pb-24 sm:pb-32 lg:pb-10 px-4 sm:px-6 md:px-12 lg:px-16">
                <div className="w-full">
                    {(() => {
                        const allWords = title.trim().split(' ')
                        const lastWord = allWords.pop()!
                        return (
                            <div className="mb-6 sm:mb-8">
                                <TypewriterEffectSmooth
                                    words={allWords.map((word) => ({
                                        text: word,
                                        className: 'text-white dark:text-white',
                                    }))}
                                    className="font-display"
                                    cursorClassName="hidden"
                                />
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

                    <div className="flex flex-col gap-3">
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

            {/* Slide indicators */}
            {backgroundImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {backgroundImages.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                            }`}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>
    )
}
