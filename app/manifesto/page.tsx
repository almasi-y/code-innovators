import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'

export const metadata = {
    title: 'Manifesto — Code Innovation Festival',
    description:
        'Read the Code Innovators Academy manifesto — our commitment to empowering the next generation of African tech innovators.',
}

const principles = [
    {
        number: 1,
        title: 'Grades 4-9 (Junior Category)',
        description:
            'We celebrate the fusion of artistic imagination and cutting-edge technology. Our events illuminate the ways in which creativity and code can coalesce to birth new forms of expression, disrupting conventional boundaries and forging uncharted territories.',
        bg: '#8b7ff5',
        textColor: '#000000',
        numColor: '#8b7ff5',
    },
    {
        number: 2,
        title: 'Grades 10-12 (Senior Category)',
        description:
            'With great technological power comes the responsibility to wield it ethically. Our discussions centre on the ethical dimensions of innovation, pushing us to build technology that is fair, transparent, and beneficial to all.',
        bg: '#00e6b4',
        textColor: '#000000',
        numColor: '#00e6b4',
    },
    {
        number: 3,
        title: 'Private and Public Schools in Mombasa',
        description:
            'More than an event, Code Innovation Festival is a strategic investment in the future of our continent. Every student who walks through our doors leaves equipped with the confidence, skills, and network to shape tomorrow.',
        bg: '#f5c842',
        textColor: '#000000',
        numColor: '#f5c842',
    },
]

export default function ManifestoPage() {
    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Navbar />

            {/* ── Intro ──────────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 pt-32 pb-20 md:pt-40 md:pb-28">
                <h1 className="font-display text-[clamp(3.5rem,10vw,9rem)] font-semibold leading-[1] tracking-tight text-white mb-8">
                    Transforming Young Minds into Solution Creators
                </h1>
                <p className="text-white text-[clamp(1.1rem,2.5vw,1.75rem)] leading-[1.4] max-w-4xl font-sans">
                    More than just an event – it&apos;s a strategic investment in the future of our continent, empowering the next generation of African tech innovators.
                </p>
            </section>

            {/* ── Principle cards (sticky-stack) ─────────────────────── */}
            <section className="flex flex-col">
                {principles.map((p, i) => (
                    <div
                        key={p.number}
                        className="sticky top-0 rounded-3xl mx-2 sm:mx-4 overflow-hidden"
                        style={{
                            backgroundColor: p.bg,
                            zIndex: 10 + i,
                            /* push each card down slightly so the previous one peeks out */
                            marginTop: i === 0 ? '0' : '-1.5rem',
                        }}
                    >
                        <div className="px-6 sm:px-10 md:px-16 pt-10 pb-20 md:pt-14 md:pb-28 min-h-[70vh] flex flex-col">
                            {/* Number badge */}
                            <div
                                className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl mb-6 shrink-0 self-start"
                                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                            >
                                <span
                                    className="font-display font-bold text-4xl sm:text-5xl md:text-6xl"
                                    style={{ color: p.numColor }}
                                >
                                    {p.number}
                                </span>
                            </div>

                            {/* Title */}
                            <h2
                                className="font-display font-semibold leading-[1.0] tracking-tight mb-auto"
                                style={{
                                    color: p.textColor,
                                    fontSize: 'clamp(3rem, 10vw, 9rem)',
                                    whiteSpace: 'pre-line',
                                }}
                            >
                                {p.title}
                            </h2>

                            {/* Description */}
                            <p
                                className="mt-10 max-w-md text-sm sm:text-base leading-relaxed font-sans"
                                style={{ color: p.textColor, opacity: 0.75 }}
                            >
                                {p.description}
                            </p>
                        </div>
                    </div>
                ))}
            </section>

            {/* Spacer so footer isn't pulled under the last sticky card */}
            <div className="h-[30vh]" />

            <Footer />
        </div>
    )
}
