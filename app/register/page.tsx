'use client'

import { useState } from 'react'
import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'
import { submitRegistration } from '@/app/actions/submitRegistration'

const teamOptions = ['1 – 2 teams', '3 – 5 teams', '5 – 10 teams']

export default function RegisterPage() {
    const [submitted, setSubmitted] = useState(false)
    const [form, setForm] = useState({
        schoolName: '',
        contactPerson: '',
        email: '',
        phone: '',
        teams: '',
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const result = await submitRegistration(form)
        setLoading(false)
        if (result.success) {
            setSubmitted(true)
        } else {
            setError(result.error ?? 'Something went wrong. Please try again.')
        }
    }

    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 px-4 sm:px-6 md:px-12 lg:px-16 pt-36 pb-24">
                {/* Header */}
                <div className="mb-14">
                    <span className="text-white/50 text-xs sm:text-sm uppercase tracking-widest mb-4 block">
                        School Registration
                    </span>
                    <h1 className="font-display text-[clamp(2.8rem,7vw,7rem)] font-semibold leading-[1] tracking-tight text-white">
                        Register Your<br />School
                    </h1>
                    <p className="mt-5 text-white/50 text-sm sm:text-base max-w-md">
                        Registration will open in January 2025. Be the first to know when applications go live!
                    </p>
                </div>

                {submitted ? (
                    <div className="max-w-xl bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#00e6b4]/20 flex items-center justify-center mb-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#00e6b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h2 className="font-display text-2xl font-semibold text-white">You&apos;re on the list!</h2>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Thank you, <span className="text-white">{form.schoolName}</span>. We&apos;ll notify{' '}
                            <span className="text-white">{form.email}</span> the moment applications open in January 2025.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-6">
                        {/* Row: school name + contact person */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="schoolName" className="text-white/60 text-xs uppercase tracking-widest">School Name *</label>
                                <input
                                    id="schoolName"
                                    name="schoolName"
                                    type="text"
                                    required
                                    value={form.schoolName}
                                    onChange={handleChange}
                                    placeholder="Enter your school name"
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="contactPerson" className="text-white/60 text-xs uppercase tracking-widest">Contact Person *</label>
                                <input
                                    id="contactPerson"
                                    name="contactPerson"
                                    type="text"
                                    required
                                    value={form.contactPerson}
                                    onChange={handleChange}
                                    placeholder="Teacher / Coordinator name"
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Row: email + phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="text-white/60 text-xs uppercase tracking-widest">Email Address *</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="school@example.com"
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="phone" className="text-white/60 text-xs uppercase tracking-widest">Phone Number</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="+254 xxx xxx xxx"
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Number of teams select */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="teams" className="text-white/60 text-xs uppercase tracking-widest">Number of Teams *</label>
                            <select
                                id="teams"
                                name="teams"
                                required
                                value={form.teams}
                                onChange={handleChange}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#8b7ff5] transition-colors appearance-none"
                            >
                                <option value="" disabled className="bg-[#1a1a1a]">Select number of teams</option>
                                {teamOptions.map((t) => (
                                    <option key={t} value={t} className="bg-[#1a1a1a]">{t}</option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="self-start bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full text-sm transition-all duration-200 shadow-lg shadow-[#8b7ff5]/20"
                        >
                            {loading ? 'Submitting…' : 'Register Your School Now'}
                        </button>
                    </form>
                )}
            </main>

            <Footer />
        </div>
    )
}
