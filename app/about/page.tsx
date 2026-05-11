import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'

export const metadata = {
    title: 'About — Code Innovation Festival',
    description:
        'Learn about the Code Innovation Festival — our goals, target audience, problem statement, and why CIF matters for the future of African tech.',
}

const objectives = [
    'Challenge learners to think innovatively and creatively in conceptualising and developing tech solutions.',
    'Empower participants to identify and articulate real-world African challenges within specified categories — education, security, health, agriculture, and environment — and design practical, tech-driven solutions.',
    'Facilitate teamwork and encourage critical evaluation of ideas, leading to robust project development and effective problem-solving.',
    'Provide a platform for learners to confidently present their projects, articulate their solutions, and engage with a diverse audience of peers, judges, and stakeholders.',
    'Identify, recognise, and celebrate young African tech talents, providing them with exposure and opportunities for mentorship and future development.',
    'Spark continued interest in STEM fields and technology-driven careers among students and encourage them to pursue further learning and specialisation.',
    'Instil in learners an understanding and appreciation of using technology as a tool for positive social change and community development.',
]

const primaryParticipants = ['Junior High School', 'Senior High School']

const stakeholders = [
    'Media outlets',
    'Community leaders',
    'Parents and guardians',
    'Potential sponsors and investors',
    'School Heads, Principals, and educators',
    'Representatives from Tech Companies & Startups',
    'NGOs focused on youth development and technology',
    'Government officials (e.g., Ministry of Education, Ministry of ICT)',
]

const whyCIF = [
    {
        title: 'Promoting cross-curricular learning and collaboration',
        body: 'The interdisciplinary nature of the projects — combining coding with social challenges, design, and presentation — fosters a holistic learning experience. Working in teams also enhances vital collaboration and communication skills, preparing learners for future professional environments.',
    },
    {
        title: 'Showcasing African creativity and ingenuity',
        body: 'CIF will be a vibrant showcase of the unique creativity and innovative spirit inherent in young African learners. It provides a much-needed platform for them to demonstrate their capabilities on a broader stage, challenging stereotypes and highlighting the continent\'s potential.',
    },
    {
        title: 'Attracting stakeholder engagement and investment',
        body: 'By inviting a diverse range of stakeholders and sponsors, we create an ecosystem of support around these young innovators. This engagement is crucial for mentorship, potential funding, and creating pathways for further development of promising projects.',
    },
]

const justifications = [
    {
        title: 'Empowering the next generation of problem-solvers',
        body: 'This event directly addresses the need to equip learners with 21st-century skills such as critical thinking, problem-solving, creativity, and collaboration. By challenging them to find tech-driven solutions for local problems, we foster a mindset of active contribution and innovation from a young age.',
    },
    {
        title: 'Driving localised solutions for African challenges',
        body: 'We believe that the most effective solutions for African problems will come from African minds. By focusing on categories like education, security, health, agriculture, and environment, we directly encourage students to apply their tech skills to immediate, tangible issues within their communities.',
    },
    {
        title: 'Nurturing a culture of innovation and entrepreneurship',
        body: 'The competition\'s emphasis on developing practical projects — from mobile apps to robotics — will inspire an entrepreneurial spirit. It encourages students to move beyond theoretical knowledge to the actual creation of functional prototypes, laying the groundwork for future tech startups.',
    },
    {
        title: 'Building a robust tech talent pipeline',
        body: 'By identifying and celebrating young tech talents from Grades 4 to Form 4, we are actively contributing to building a strong pipeline of skilled individuals who will drive Africa\'s digital transformation. This platform provides invaluable early exposure and validation for their abilities.',
    },
]

export default function AboutPage() {
    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Navbar />

            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 pt-32 pb-16 md:pt-40 md:pb-24">
                <p className="text-[#8b7ff5] text-xs uppercase tracking-widest mb-4">About CIF</p>
                <h1 className="font-display text-[clamp(3rem,9vw,8rem)] font-semibold leading-[1] tracking-tight text-white mb-8">
                    Innovate for Africa
                </h1>
                <p className="text-white/60 text-[clamp(1rem,2vw,1.4rem)] leading-relaxed max-w-3xl">
                    &ldquo;Coding the Future with Purpose&rdquo; — an inter-school technology competition designed to
                    unleash the ingenuity of students across Mombasa and transform them from tech consumers into creators.
                </p>
            </section>

            {/* ── Problem Statement ────────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 py-20 border-t border-white/10">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
                    <div>
                        <p className="text-[#00e6b4] text-xs uppercase tracking-widest mb-4">The Problem</p>
                        <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.05] text-white mb-6">
                            Problem<br />Statement
                        </h2>
                    </div>
                    <div className="flex flex-col gap-6 text-white/60 text-base leading-relaxed">
                        <p>
                            Despite Africa&apos;s rapid technological adoption, a significant gap persists in the proactive
                            development of local, tech-driven solutions for pressing societal challenges. Many young Africans
                            are consumers of technology but lack structured opportunities to become creators and innovators.
                            Critical areas such as{' '}
                            <span className="text-white font-medium">education, security, health, agriculture, cybersecurity,</span>{' '}
                            and <span className="text-white font-medium">environment</span> in our communities often face
                            complex issues that could be significantly alleviated through innovative digital approaches.
                        </p>
                        <p>
                            Currently, students often learn theoretical concepts of coding and technology without direct
                            application to real-world problems. This disconnect limits their understanding of technology&apos;s
                            transformative power. Furthermore, there&apos;s a need for a platform that not only nurtures
                            these tech talents but also connects them with mentors, resources, and pathways for further
                            development. Without such initiatives, Africa risks falling behind in leveraging its demographic
                            dividend to drive sustainable, homegrown technological advancement.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Goals & Objectives ───────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 py-20 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[#8b7ff5] text-xs uppercase tracking-widest mb-4">What we set out to do</p>
                    <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.05] text-white mb-4">
                        Event Goals<br />&amp; Objectives
                    </h2>
                    <p className="text-white/50 text-base mb-16 max-w-2xl">
                        To empower and inspire the next generation of African tech innovators by providing a dynamic platform
                        to develop and showcase technology-driven solutions for pressing local challenges.
                    </p>

                    <div className="grid gap-4">
                        {objectives.map((obj, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-5 p-5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 transition-colors"
                            >
                                <span
                                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
                                    style={{ background: '#8b7ff5' }}
                                >
                                    {i + 1}
                                </span>
                                <p className="text-white/70 text-sm leading-relaxed pt-1">{obj}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Target Audience ──────────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 py-20 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[#00e6b4] text-xs uppercase tracking-widest mb-4">Who it&apos;s for</p>
                    <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.05] text-white mb-16">
                        Target Audience
                    </h2>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Primary Participants */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-[#8b7ff5]" />
                                <h3 className="text-white font-semibold text-lg">Primary Participants</h3>
                            </div>
                            <p className="text-white/40 text-sm mb-5">1,000 students from 50 schools, specifically:</p>
                            <div className="flex flex-col gap-3">
                                {primaryParticipants.map((p) => (
                                    <div
                                        key={p}
                                        className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                                        style={{ background: '#8b7ff5' }}
                                    >
                                        <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-white font-semibold text-sm">{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stakeholders */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-[#00e6b4]" />
                                <h3 className="text-white font-semibold text-lg">Key Stakeholders &amp; Attendees</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                {stakeholders.map((s) => (
                                    <div
                                        key={s}
                                        className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/10 bg-white/3"
                                    >
                                        <svg className="w-4 h-4 text-[#8b7ff5] shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-white/70 text-sm">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Why CIF ──────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 py-20 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[#8b7ff5] text-xs uppercase tracking-widest mb-4">The case for CIF</p>
                    <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.05] text-white mb-16">
                        Why CIF?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {whyCIF.map((item) => (
                            <div
                                key={item.title}
                                className="p-7 rounded-3xl border border-white/10 bg-white/3 flex flex-col gap-4 hover:border-[#8b7ff5]/40 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,127,245,0.15)' }}>
                                    <svg className="w-5 h-5 text-[#8b7ff5]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="text-white font-semibold text-base leading-snug">{item.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Justification ────────────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 py-20 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[#00e6b4] text-xs uppercase tracking-widest mb-4">Why it matters</p>
                    <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.05] text-white mb-4">
                        Justification
                    </h2>
                    <p className="text-white/50 text-base mb-16 max-w-3xl">
                        &ldquo;Innovate for Africa: Coding the Future with Purpose&rdquo; is more than just an event — it&apos;s a
                        strategic investment in the future of our continent and specifically Kenya. Here&apos;s why this
                        competition is not just relevant, but crucial:
                    </p>

                    <div className="flex flex-col gap-px">
                        {justifications.map((item, i) => (
                            <div
                                key={item.title}
                                className="grid md:grid-cols-[auto_1fr_2fr] gap-6 py-8 border-t border-white/10 items-start"
                            >
                                <span className="text-white/20 font-mono text-sm w-8">0{i + 1}</span>
                                <h3 className="text-white font-semibold text-base leading-snug">{item.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <section className="px-4 sm:px-6 md:px-12 lg:px-16 py-20 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                    <div>
                        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-semibold text-white leading-tight">
                            Ready to be part<br />of the future?
                        </h2>
                        <p className="text-white/40 text-sm mt-3">Join 1,000 students from 50 schools across Mombasa.</p>
                    </div>
                    <a
                        href="/register"
                        className="shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all duration-200"
                        style={{ background: '#8b7ff5' }}
                    >
                        Register Your School
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    )
}
