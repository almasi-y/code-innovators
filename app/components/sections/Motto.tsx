import Link from 'next/link'

export default function Motto() {
    return (
        <section className="relative z-10 flex items-start justify-start overflow-hidden -mt-px" style={{transform:'translateZ(0)'}}>
            {/* Gradient overlay — fades in from top so there's no hard line after the Hero */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />

            <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-16 pt-20 pb-10">
                <div className="w-full max-w-none">
                    {/* Label */}
                    <span className="text-white text-xs sm:text-sm uppercase tracking-widest mb-6 block">
                        Conference motto
                    </span>

                    {/* Big motto text — massive like the reference */}
                    <h2
                        className="font-display text-[clamp(2.2rem,6.5vw,6.5rem)] font-semibold leading-[1.05] text-white mb-10 tracking-tight"
                        style={{
                            textShadow: '0 2px 40px rgba(0,0,0,0.4)',
                        }}
                    >
                        More than just an event – it&apos;s a strategic investment in the future of our continent, empowering the next generation of African tech innovators.
                    </h2>

                    {/* Manifesto pill */}
                    <Link
                        href="/manifesto"
                        className="inline-block bg-[#8b7ff5]/70 hover:bg-[#8b7ff5] transition-colors text-white font-medium px-8 py-4 rounded-2xl text-base backdrop-blur-sm"
                    >
                        Target Audience
                    </Link>
                </div>
            </div>

            {/* Scroll blur fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
        </section>
    )
}
