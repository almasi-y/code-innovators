'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { submitSponsorApplication } from '@/app/actions/submitSponsor'

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Custom']

const STEPS = [
    { number: 1, title: 'Contact' },
    { number: 2, title: 'Sponsorship' },
    { number: 3, title: 'Review' },
]

const inputClass = 'h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#8b7ff5] focus-visible:ring-[#8b7ff5]/20 rounded-xl text-sm'
const labelClass = 'text-white/60 text-xs uppercase tracking-widest mb-1 block'

type FieldDef = {
    key: string; label: string; hint: string
    type?: string; placeholder: string; required?: boolean
    isSelect?: boolean; isTextarea?: boolean
}

const STEP1_FIELDS: FieldDef[] = [
    { key: 'name',         label: 'Full Name',       hint: 'Who should we contact?',                 placeholder: 'Jane Doe',              required: true },
    { key: 'organisation', label: 'Organisation',    hint: 'What company or organisation are you?',  placeholder: 'Acme Corp',             required: true },
    { key: 'email',        label: 'Email Address',   hint: 'Best email to reach you.',               placeholder: 'jane@acme.com',         required: true, type: 'email' },
    { key: 'phone',        label: 'Phone Number',    hint: 'Optional — for quick follow-ups.',        placeholder: '+254 700 000 000',       type: 'tel' },
]

const STEP2_FIELDS: FieldDef[] = [
    { key: 'tier',    label: 'Sponsorship Tier', hint: 'Which tier are you interested in?',       placeholder: 'Select a tier',  required: true, isSelect: true },
    { key: 'message', label: 'Message',          hint: "Anything you'd like us to know?",         placeholder: "Tell us about your organisation and how you'd like to partner…", isTextarea: true },
]

function getMobileFields(step: number) {
    if (step === 1) return STEP1_FIELDS
    if (step === 2) return STEP2_FIELDS
    return []
}

export default function SponsorPage() {
    const router = useRouter()

    const [step, setStep]             = useState(1)
    const [direction, setDirection]   = useState(1)
    const [fieldIndex, setFieldIndex] = useState(0)
    const [vpHeight, setVpHeight]     = useState('100dvh')
    const [vpTop, setVpTop]           = useState(0)
    const [submitted, setSubmitted]   = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        name: '', organisation: '', email: '', phone: '',
        tier: '', message: '',
    })
    const [loading, setLoading]         = useState(false)
    const [statusMessage, setStatusMsg] = useState('')
    const [error, setError]             = useState<string | null>(null)

    useEffect(() => {
        const vv = window.visualViewport
        if (!vv) return
        const update = () => {
            setVpHeight(`${Math.round(vv.height)}px`)
            setVpTop(Math.round(vv.offsetTop))
        }
        update()
        vv.addEventListener('resize', update)
        vv.addEventListener('scroll', update)
        return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
    }, [])

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120) }, [fieldIndex, step])
    useEffect(() => { setFieldIndex(0) }, [step])

    function handleInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    }

    function validateField(field: FieldDef): string | null {
        if (!field.required) return null
        const val = (form as Record<string, string>)[field.key]
        if (!val?.trim()) return `${field.label} is required.`
        return null
    }

    function validateStep(): string | null {
        if (step === 1) {
            if (!form.name.trim())         return 'Full name is required.'
            if (!form.organisation.trim()) return 'Organisation is required.'
            if (!form.email.trim())        return 'Email address is required.'
        }
        if (step === 2) {
            if (!form.tier) return 'Please select a sponsorship tier.'
        }
        return null
    }

    const mobileFields      = getMobileFields(step)
    const isLastMobileField = fieldIndex >= mobileFields.length - 1
    const currentField      = mobileFields[fieldIndex]
    const globalProgress    = ((step - 1) / STEPS.length) + (fieldIndex / ((mobileFields.length || 1) * STEPS.length))

    function mobileNext() {
        setError(null)
        if (currentField) {
            const err = validateField(currentField)
            if (err) { setError(err); return }
        }
        if (!isLastMobileField) { setDirection(1); setFieldIndex(f => f + 1) }
        else goNextStep()
    }

    function mobileBack() {
        setError(null)
        if (fieldIndex > 0) { setDirection(-1); setFieldIndex(f => f - 1) }
        else goPrevStep()
    }

    function goNextStep() {
        const err = validateStep()
        if (err) { setError(err); return }
        setError(null); setDirection(1)
        setStep(s => Math.min(s + 1, STEPS.length))
    }

    function goPrevStep() {
        setError(null); setDirection(-1)
        setStep(s => Math.max(s - 1, 1))
    }

    async function handleSubmit() {
        setError(null)
        setLoading(true); setStatusMsg('Submitting your application…')
        const result = await submitSponsorApplication(form)
        setLoading(false); setStatusMsg('')
        if (result.success) {
            setSubmitted(true)
        } else {
            setError(result.error ?? 'Something went wrong. Please try again.')
        }
    }

    const variants = {
        enter:  (dir: number) => ({ x: dir > 0 ?  48 : -48, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit:   (dir: number) => ({ x: dir > 0 ? -48 :  48, opacity: 0 }),
    }

    const StepBar = () => (
        <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
                <div key={s.number} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            step === s.number ? 'bg-[#8b7ff5] text-white shadow-lg shadow-[#8b7ff5]/30'
                            : step > s.number  ? 'bg-[#8b7ff5]/30 text-[#8b7ff5]'
                            : 'bg-white/10 text-white/30'
                        }`}>
                            {step > s.number
                                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6L9 17l-5-5"/></svg>
                                : s.number}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest transition-colors ${step === s.number ? 'text-white/70' : 'text-white/25'}`}>
                            {s.title}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-5 transition-all duration-500 ${step > s.number ? 'bg-[#8b7ff5]/50' : 'bg-white/10'}`} />
                    )}
                </div>
            ))}
        </div>
    )

    const LoadingOverlay = () => (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-10 py-8 flex flex-col items-center gap-4 text-center">
                <svg className="animate-spin w-10 h-10 text-[#8b7ff5]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                </svg>
                <p className="text-white font-display text-lg">{statusMessage}</p>
            </div>
        </div>
    )

    const SuccessCard = ({ compact = false }: { compact?: boolean }) => (
        <div className={`bg-white/5 border border-white/10 rounded-3xl flex flex-col gap-4 ${compact ? 'p-8 mx-5' : 'p-10 max-w-xl'}`}>
            <div className="w-14 h-14 rounded-full bg-[#8b7ff5]/20 flex items-center justify-center mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#8b7ff5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
            </div>
            <h2 className="font-display text-2xl font-semibold text-white">Application received!</h2>
            <p className="text-white/60 text-sm leading-relaxed">
                Thank you, <span className="text-white">{form.name}</span>. Our team will review your application and get back to you at <span className="text-white">{form.email}</span> within 2–3 business days.
            </p>
        </div>
    )

    return (
        <>
            {loading && <LoadingOverlay />}

            {/* ════════════════════════════════════════════
                MOBILE — fixed, one field at a time
                ════════════════════════════════════════════ */}
            <div className="md:hidden bg-background flex flex-col"
                style={{ position: 'fixed', left: 0, right: 0, top: vpTop, height: vpHeight }}>

                {/* Top bar */}
                <div className="shrink-0 px-5 pt-5 pb-3">
                    <div className="w-full h-1 bg-white/10 rounded-full mb-5 overflow-hidden">
                        <motion.div
                            className="h-full bg-[#8b7ff5] rounded-full"
                            animate={{ width: `${Math.round(globalProgress * 100 + 33)}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {(step > 1 || fieldIndex > 0) && !submitted && (
                                <button onClick={mobileBack} className="text-white/50 hover:text-white p-1 -ml-1 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                                    </svg>
                                </button>
                            )}
                            <span className="text-white/40 text-xs uppercase tracking-widest">
                                {submitted ? 'Done' : STEPS[step - 1].title}
                            </span>
                        </div>
                        {!submitted && <span className="text-white/30 text-xs">Step {step} of {STEPS.length}</span>}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={submitted ? 'success' : `${step}-${fieldIndex}`}
                            custom={direction}
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="pt-10 pb-6"
                        >
                            {submitted ? (
                                <SuccessCard compact />
                            ) : (
                                <>
                                    {/* Steps 1 & 2: one field at a time */}
                                    {currentField && (step === 1 || step === 2) && (
                                        <>
                                            <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">
                                                {currentField.label}
                                                {currentField.required && <span className="text-[#8b7ff5] ml-1">*</span>}
                                            </p>
                                            <p className="text-white/40 text-base mb-8">{currentField.hint}</p>

                                            {currentField.isSelect && (
                                                <div className="w-full">
                                                    <Select value={form.tier} onValueChange={v => setForm(p => ({ ...p, tier: v }))}>
                                                        <SelectTrigger className="h-14 w-full bg-white/5 border-white/10 text-white rounded-2xl text-base px-4 focus:border-[#8b7ff5]">
                                                            <SelectValue placeholder="Select a tier" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#1e1e1e] border-white/10 text-white" style={{ minWidth: 'var(--radix-select-trigger-width)' }}>
                                                            {TIERS.map(t => (
                                                                <SelectItem key={t} value={t} className="text-white focus:bg-white/10 focus:text-white text-base py-3">{t}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {currentField.isTextarea && (
                                                <textarea
                                                    name={currentField.key}
                                                    value={(form as Record<string, string>)[currentField.key]}
                                                    onChange={e => setForm(p => ({ ...p, [currentField.key]: e.target.value }))}
                                                    placeholder={currentField.placeholder}
                                                    rows={5}
                                                    className="w-full bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#8b7ff5] transition-colors resize-none"
                                                />
                                            )}

                                            {!currentField.isSelect && !currentField.isTextarea && (
                                                <input
                                                    ref={inputRef}
                                                    name={currentField.key}
                                                    type={currentField.type ?? 'text'}
                                                    value={(form as Record<string, string>)[currentField.key]}
                                                    onChange={e => setForm(p => ({ ...p, [currentField.key]: e.target.value }))}
                                                    placeholder={currentField.placeholder}
                                                    onKeyDown={e => e.key === 'Enter' && mobileNext()}
                                                    className="w-full h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                                    suppressHydrationWarning
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Step 3: Review */}
                                    {step === 3 && (
                                        <>
                                            <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">Review</p>
                                            <p className="text-white/40 text-base mb-6">Everything correct?</p>
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-sm">
                                                <Row label="Name"         value={form.name} />
                                                <Row label="Organisation" value={form.organisation} />
                                                <Row label="Email"        value={form.email} />
                                                {form.phone && <Row label="Phone" value={form.phone} />}
                                                <div className="border-t border-white/10" />
                                                <Row label="Tier"    value={form.tier} />
                                                {form.message && <Row label="Message" value={form.message} />}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-sm px-1 -mt-2 mb-4">{error}</motion.p>
                    )}
                </div>

                {/* Bottom button */}
                {!submitted && (
                    <div className="shrink-0 px-5 pb-5 pt-3 border-t border-white/5">
                        {step === STEPS.length ? (
                            <button onClick={handleSubmit} disabled={loading}
                                className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/25">
                                Submit Application
                            </button>
                        ) : (
                            <button onClick={mobileNext}
                                className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/30">
                                {isLastMobileField ? 'Continue →' : 'Next →'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════
                DESKTOP — full page, all fields per step
                ════════════════════════════════════════════ */}
            <div className="hidden md:flex flex-col min-h-screen bg-background overflow-x-hidden">
                <Navbar />

                {loading && <LoadingOverlay />}

                <main className="flex-1 w-full px-4 sm:px-6 md:px-12 lg:px-16 pt-24 sm:pt-32 pb-24">
                    <div className="mb-12">
                        <span className="text-white/50 text-xs uppercase tracking-widest mb-4 block">Partnership</span>
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-white">
                            Become a<br />Sponsor
                        </h1>
                    </div>

                    {submitted ? (
                        <SuccessCard />
                    ) : (
                        <div className="max-w-xl">
                            <div className="mb-10"><StepBar /></div>

                            <div className="relative overflow-hidden">
                                <AnimatePresence mode="wait" custom={direction}>
                                    <motion.div key={step} custom={direction} variants={variants}
                                        initial="enter" animate="center" exit="exit"
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        className="flex flex-col gap-5">

                                        {step === 1 && <>
                                            <div>
                                                <p className="text-white font-semibold text-lg mb-1">Contact Information</p>
                                                <p className="text-white/40 text-sm">Tell us who we should get in touch with.</p>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                {STEP1_FIELDS.map(f => (
                                                    <div key={f.key} className="flex flex-col gap-1.5">
                                                        <label className={labelClass}>{f.label}{f.required && ' *'}</label>
                                                        <Input name={f.key} type={f.type ?? 'text'} required={f.required}
                                                            value={(form as Record<string, string>)[f.key]}
                                                            onChange={handleInput} placeholder={f.placeholder} className={inputClass} />
                                                    </div>
                                                ))}
                                            </div>
                                        </>}

                                        {step === 2 && <>
                                            <div>
                                                <p className="text-white font-semibold text-lg mb-1">Sponsorship Details</p>
                                                <p className="text-white/40 text-sm">Pick a tier and tell us anything relevant.</p>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className={labelClass}>Sponsorship Tier *</label>
                                                    <Select value={form.tier} onValueChange={v => setForm(p => ({ ...p, tier: v }))}>
                                                        <SelectTrigger className="h-12 w-full bg-white/5 border-white/10 text-white rounded-xl text-sm px-4 focus:border-[#8b7ff5]">
                                                            <SelectValue placeholder="Select a tier" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#1e1e1e] border-white/10 text-white" style={{ minWidth: 'var(--radix-select-trigger-width)' }}>
                                                            {TIERS.map(t => (
                                                                <SelectItem key={t} value={t} className="text-white focus:bg-white/10 focus:text-white">{t}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className={labelClass}>Message <span className="text-white/25 normal-case">(optional)</span></label>
                                                    <Textarea name="message" value={form.message} onChange={handleInput}
                                                        placeholder="Tell us about your organisation and how you'd like to partner…"
                                                        rows={4}
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#8b7ff5] focus-visible:ring-[#8b7ff5]/20 rounded-xl text-sm resize-none" />
                                                </div>
                                            </div>
                                        </>}

                                        {step === 3 && <>
                                            <div>
                                                <p className="text-white font-semibold text-lg mb-1">Review & Submit</p>
                                                <p className="text-white/40 text-sm">Everything correct? Submit your application.</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-sm">
                                                <Row label="Name"         value={form.name} />
                                                <Row label="Organisation" value={form.organisation} />
                                                <Row label="Email"        value={form.email} />
                                                {form.phone && <Row label="Phone" value={form.phone} />}
                                                <div className="border-t border-white/10" />
                                                <Row label="Tier"    value={form.tier} />
                                                {form.message && <Row label="Message" value={form.message} />}
                                            </div>
                                            <button onClick={handleSubmit} disabled={loading}
                                                className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/25">
                                                Submit Application
                                            </button>
                                        </>}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {error && (
                                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 text-red-400 text-sm">{error}</motion.p>
                            )}

                            <div className={`flex mt-8 gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                                {step > 1 && (
                                    <button onClick={goPrevStep}
                                        className="px-6 py-3 rounded-[1.2rem] border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all">
                                        ← Back
                                    </button>
                                )}
                                {step < STEPS.length && (
                                    <button onClick={goNextStep}
                                        className="px-8 py-3 rounded-[1.2rem] bg-[#8b7ff5]/80 hover:bg-[#8b7ff5] text-white text-sm font-bold transition-all shadow-lg shadow-[#8b7ff5]/20">
                                        Continue →
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        </>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-white/40 shrink-0">{label}</span>
            <span className="text-white text-right">{value || '—'}</span>
        </div>
    )
}
