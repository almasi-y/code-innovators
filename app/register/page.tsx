'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent, SelectGroup,
    SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { completeRegistrationWithPayment } from '@/app/actions/completeRegistration'
import { redeemCouponAndRegister } from '@/app/actions/redeemCoupon'
import { getRegistrationFee } from '@/app/actions/getRegistrationFee'

declare global {
    interface Window {
        PaystackPop: {
            setup(config: {
                key: string; email: string; amount: number; currency: string
                ref: string; metadata?: Record<string, unknown>
                callback: (r: { reference: string }) => void; onClose: () => void
            }): { openIframe(): void }
        }
    }
}

const THEMATIC_AREAS = {
    Technology: ['Web & Mobile Development', 'Animation (e.g. Scratch)', 'Robotics'],
    'Problem Solving': [
        'Education', 'Solutions for Community Safety',
        'Public Health & Healthcare', 'Sustainable Farming & Crops',
        'Climate Change (e.g. Waste Management, Energy)',
    ],
} as const

type ThematicArea = keyof typeof THEMATIC_AREAS

const MAX_LEARNERS = 5
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!

const inputClass = 'h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#8b7ff5] focus-visible:ring-[#8b7ff5]/20 rounded-xl text-sm'
const triggerClass = 'h-12 w-full bg-white/5 border-white/10 text-white data-placeholder:text-white/40 focus-visible:border-[#8b7ff5] focus-visible:ring-[#8b7ff5]/20 rounded-xl text-sm px-4'
const labelClass = 'text-white/60 text-xs uppercase tracking-widest mb-1 block'

const STEPS = [
    { number: 1, title: 'School Info' },
    { number: 2, title: 'Team Details' },
    { number: 3, title: 'Learners' },
    { number: 4, title: 'Payment' },
]

type FieldDef = {
    key: string; label: string; hint: string
    type?: string; placeholder: string; required?: boolean
    isSelect?: boolean
}

const STEP1_FIELDS: FieldDef[] = [
    { key: 'schoolName',    label: 'School Name',    hint: 'What school are you registering?',  placeholder: 'e.g. Mombasa Academy',       required: true },
    { key: 'contactPerson', label: 'Contact Person', hint: 'Who should we contact?',             placeholder: 'Teacher / Coordinator name', required: true },
    { key: 'email',         label: 'Email Address',  hint: 'Where do we send your ticket?',      placeholder: 'school@example.com',          required: true, type: 'email' },
    { key: 'phone',         label: 'Phone Number',   hint: 'Optional — how can we reach you?',   placeholder: '+254 xxx xxx xxx',            type: 'tel' },
]
const STEP2_FIELDS: FieldDef[] = [
    { key: 'teamName',     label: 'Team Name',     hint: 'What will your team be called?',               placeholder: 'e.g. Code Breakers',   required: true },
    { key: 'thematicArea', label: 'Thematic Area', hint: 'Which area does your project fall under?',     placeholder: 'Select thematic area', required: true, isSelect: true },
    { key: 'category',     label: 'Category',      hint: 'Pick your specific sub-category.',             placeholder: 'Select category',      required: true, isSelect: true },
]

function getMobileFields(step: number) {
    if (step === 1) return STEP1_FIELDS
    if (step === 2) return STEP2_FIELDS
    return []
}

export default function RegisterPage() {
    const router = useRouter()

    const [step, setStep]             = useState(1)
    const [direction, setDirection]   = useState(1)
    const [fieldIndex, setFieldIndex] = useState(0)
    const [vpHeight, setVpHeight]     = useState('100dvh')
    const [vpTop, setVpTop]           = useState(0)

    const inputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        schoolName: '', contactPerson: '', email: '', phone: '',
        teamName: '', thematicArea: '' as ThematicArea | '', category: '',
    })
    const [learners, setLearners]       = useState<string[]>(['', ''])
    const [coupon, setCoupon]           = useState('')
    const [loading, setLoading]           = useState(false)
    const [statusMessage, setStatusMsg]   = useState('')
    const [error, setError]               = useState<string | null>(null)
    const [ticketAmountKes, setTicketAmountKes] = useState(20)

    useEffect(() => {
        getRegistrationFee().then(setTicketAmountKes)
    }, [])

    const categories = form.thematicArea ? THEMATIC_AREAS[form.thematicArea] : []
    const hasCoupon  = coupon.trim().length > 0

    // Track visualViewport so the fixed container stays pinned above the keyboard on iOS + Android.
    // offsetTop accounts for iOS scrolling the page when an input is focused.
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

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    }
    function handleLearnerChange(i: number, v: string) {
        setLearners(p => p.map((l, idx) => idx === i ? v : l))
    }
    function addLearner() { if (learners.length < MAX_LEARNERS) setLearners(p => [...p, '']) }
    function removeLearner(i: number) { if (learners.length > 1) setLearners(p => p.filter((_, idx) => idx !== i)) }
    function getPayload() {
        return { ...form, thematicArea: form.thematicArea as string, learnerNames: learners.filter(l => l.trim()) }
    }
    function handleSuccess(ticketId: string, token: string) {
        setStatusMsg('Done! Redirecting to your ticket…')
        router.push(`/tickets/${ticketId}?token=${token}`)
    }

    function validateField(field: FieldDef): string | null {
        if (!field.required) return null
        const val = (form as Record<string, string>)[field.key]
        if (!val?.trim()) return `${field.label} is required.`
        return null
    }

    function validateStep(): string | null {
        if (step === 1) {
            if (!form.schoolName.trim())    return 'School name is required.'
            if (!form.contactPerson.trim()) return 'Contact person is required.'
            if (!form.email.trim())         return 'Email address is required.'
        }
        if (step === 2) {
            if (!form.teamName.trim()) return 'Team name is required.'
            if (!form.thematicArea)    return 'Please select a thematic area.'
            if (!form.category)        return 'Please select a category.'
        }
        if (step === 3) {
            if (learners.filter(l => l.trim()).length < 1) return 'Enter at least one learner name.'
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

    async function handleCouponSubmit() {
        setLoading(true); setStatusMsg('Validating coupon…')
        const result = await redeemCouponAndRegister(coupon, getPayload())
        if (result.success && result.ticketId && result.token) {
            handleSuccess(result.ticketId, result.token)
        } else {
            setLoading(false); setStatusMsg(''); setError(result.error ?? 'Coupon redemption failed.')
        }
    }

    function handlePay() {
        setError(null)
        if (hasCoupon) { handleCouponSubmit(); return }
        if (!window.PaystackPop) { setError('Payment widget still loading. Try again.'); return }

        const bytes = new Uint8Array(12); crypto.getRandomValues(bytes)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const rand = Array.from(bytes).map(b => chars[b % chars.length]).join('')

        window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY, email: form.email,
            amount: ticketAmountKes * 100, currency: 'KES',
            ref: `REG-${rand}`,
            metadata: { schoolName: form.schoolName, contactPerson: form.contactPerson, teamName: form.teamName },
            callback(response) {
                setLoading(true); setStatusMsg('Payment confirmed! Saving your registration…')
                completeRegistrationWithPayment(response.reference, getPayload()).then(result => {
                    if (result.success && result.ticketId && result.token) {
                        handleSuccess(result.ticketId, result.token)
                    } else {
                        setLoading(false); setStatusMsg(''); setError(result.error ?? 'Something went wrong.')
                    }
                })
            },
            onClose() {},
        }).openIframe()
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
                            : step > s.number ? 'bg-[#8b7ff5]/30 text-[#8b7ff5]'
                            : 'bg-white/10 text-white/30'
                        }`}>
                            {step > s.number
                                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg>
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
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
                </svg>
                <p className="text-white font-display text-lg">{statusMessage}</p>
            </div>
        </div>
    )

    return (
        <>
            <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
            {loading && <LoadingOverlay />}

            {/* ════════════════════════════════════════════════════
                MOBILE  — visible below md, one field at a time
                ════════════════════════════════════════════════════ */}
            <div className="md:hidden bg-background flex flex-col"
                style={{ position: 'fixed', left: 0, right: 0, top: vpTop, height: vpHeight }}
            >

                {/* Top bar */}
                <div className="shrink-0 px-5 pt-5 pb-3">
                    <div className="w-full h-1 bg-white/10 rounded-full mb-5 overflow-hidden">
                        <motion.div
                            className="h-full bg-[#8b7ff5] rounded-full"
                            animate={{ width: `${Math.round(globalProgress * 100 + 25)}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {(step > 1 || fieldIndex > 0) && (
                                <button onClick={mobileBack} className="text-white/50 hover:text-white p-1 -ml-1 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <path d="M19 12H5M12 5l-7 7 7 7" />
                                    </svg>
                                </button>
                            )}
                            <span className="text-white/40 text-xs uppercase tracking-widest">{STEPS[step - 1].title}</span>
                        </div>
                        <span className="text-white/30 text-xs">Step {step} of {STEPS.length}</span>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={`${step}-${fieldIndex}`}
                            custom={direction}
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="pt-10 pb-6"
                        >
                            {/* Steps 1 & 2: single field at a time */}
                            {currentField && (step === 1 || step === 2) && (
                                <>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">
                                        {currentField.label}
                                        {currentField.required && <span className="text-[#8b7ff5] ml-1">*</span>}
                                    </p>
                                    <p className="text-white/40 text-base mb-8">{currentField.hint}</p>

                                    {currentField.isSelect && currentField.key === 'thematicArea' && (
                                        <div className="w-full">
                                            <Select value={form.thematicArea} onValueChange={v => setForm(p => ({ ...p, thematicArea: v as ThematicArea, category: '' }))}>
                                                <SelectTrigger className="h-14 w-full bg-white/5 border-white/10 text-white rounded-2xl text-base px-4 focus:border-[#8b7ff5]">
                                                    <SelectValue placeholder="Select thematic area" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1e1e1e] border-white/10 text-white" style={{ minWidth: 'var(--radix-select-trigger-width)' }}>
                                                    {(Object.keys(THEMATIC_AREAS) as ThematicArea[]).map(area => (
                                                        <SelectItem key={area} value={area} className="text-white focus:bg-white/10 focus:text-white text-base py-3">{area}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {currentField.isSelect && currentField.key === 'category' && (
                                        <div className="w-full">
                                            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))} disabled={!form.thematicArea}>
                                                <SelectTrigger className="h-14 w-full bg-white/5 border-white/10 text-white rounded-2xl text-base px-4 focus:border-[#8b7ff5] disabled:opacity-40">
                                                    <SelectValue placeholder={form.thematicArea ? 'Select category' : 'Select thematic area first'} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1e1e1e] border-white/10 text-white" style={{ minWidth: 'var(--radix-select-trigger-width)' }}>
                                                    <SelectGroup>
                                                        <SelectLabel className="text-white/40">{form.thematicArea}</SelectLabel>
                                                        {categories.map(cat => (
                                                            <SelectItem key={cat} value={cat} className="text-white focus:bg-white/10 focus:text-white text-base py-3">{cat}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {!currentField.isSelect && (
                                        <input
                                            ref={inputRef}
                                            name={currentField.key}
                                            type={currentField.type ?? 'text'}
                                            value={(form as Record<string, string>)[currentField.key]}
                                            onChange={e => setForm(p => ({ ...p, [currentField.key]: e.target.value }))}
                                            placeholder={currentField.placeholder}
                                            onKeyDown={e => e.key === 'Enter' && mobileNext()}
                                            className="w-full h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                        />
                                    )}
                                </>
                            )}

                            {/* Step 3: Learners */}
                            {step === 3 && (
                                <>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">Learner Names</p>
                                    <p className="text-white/40 text-base mb-8">Add the students on your team — up to {MAX_LEARNERS}.</p>
                                    <div className="flex flex-col gap-4">
                                        {learners.map((learner, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-white/30 text-sm font-mono w-5 text-center shrink-0">{i + 1}</span>
                                                <input
                                                    value={learner}
                                                    onChange={e => handleLearnerChange(i, e.target.value)}
                                                    placeholder={`Student ${i + 1} full name`}
                                                    className="flex-1 h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                                />
                                                {learners.length > 1 && (
                                                    <button type="button" onClick={() => removeLearner(i)}
                                                        className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40">
                                                            <path d="M18 6L6 18M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {learners.length < MAX_LEARNERS && (
                                        <button type="button" onClick={addLearner}
                                            className="mt-4 flex items-center gap-2 text-[#8b7ff5] hover:text-[#a094f7] text-sm font-medium transition-colors">
                                            <span className="text-xl leading-none">+</span> Add another student
                                        </button>
                                    )}
                                    <p className="mt-3 text-white/25 text-xs">{learners.filter(l => l.trim()).length} / {MAX_LEARNERS} students added</p>
                                </>
                            )}

                            {/* Step 4: Review & Pay */}
                            {step === 4 && (
                                <>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">Review & Pay</p>
                                    <p className="text-white/40 text-base mb-6">Everything looks good? Complete your registration.</p>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-sm mb-6">
                                        <Row label="School"   value={form.schoolName} />
                                        <Row label="Contact"  value={form.contactPerson} />
                                        <Row label="Email"    value={form.email} />
                                        <div className="border-t border-white/10" />
                                        <Row label="Team"     value={form.teamName} />
                                        <Row label="Domain"   value={form.thematicArea} />
                                        <Row label="Category" value={form.category} />
                                        <div className="border-t border-white/10" />
                                        <Row label="Students" value={learners.filter(l => l.trim()).join(', ')} />
                                    </div>
                                    <div className="flex flex-col gap-2 mb-2">
                                        <label className={labelClass}>Coupon Code <span className="text-white/25 normal-case">(optional)</span></label>
                                        <input
                                            value={coupon}
                                            onChange={e => setCoupon(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="w-full h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 font-mono tracking-wider focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                        />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-sm px-1 -mt-2 mb-4">
                            {error}
                        </motion.p>
                    )}
                </div>

                {/* Bottom button */}
                <div className="shrink-0 px-5 pb-5 pt-3 border-t border-white/5">
                    {step === 4 ? (
                        <button onClick={handlePay} disabled={loading}
                            className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/25">
                            {hasCoupon ? 'Redeem Coupon & Register' : `Pay KES ${ticketAmountKes} & Register`}
                        </button>
                    ) : (
                        <button onClick={step === 3 ? goNextStep : mobileNext}
                            className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/30">
                            {(step === 3 || isLastMobileField) ? 'Continue →' : 'Next →'}
                        </button>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
                DESKTOP  — visible from md upward, all fields per step
                ════════════════════════════════════════════════════ */}
            <div className="hidden md:flex flex-col min-h-screen bg-background overflow-x-hidden">
                <Navbar />

                <main className="flex-1 w-full px-4 sm:px-6 md:px-12 lg:px-16 pt-24 sm:pt-28 pb-24">
                    <div className="mb-12">
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-white">
                            Register Your<br />School
                        </h1>
                        <p className="mt-4 text-white/50 text-sm sm:text-base max-w-md">
                            Registration fee: <span className="text-white font-semibold">KES {ticketAmountKes.toLocaleString()} per student</span>.
                            You&apos;ll receive a ticket immediately after payment.
                        </p>
                    </div>

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
                                            <p className="text-white font-semibold text-lg mb-1">School Information</p>
                                            <p className="text-white/40 text-sm">Tell us about your school and who we should contact.</p>
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
                                            <p className="text-white font-semibold text-lg mb-1">Team Details</p>
                                            <p className="text-white/40 text-sm">Name your team and pick the competition domain.</p>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className={labelClass}>Team Name *</label>
                                                <Input name="teamName" required value={form.teamName} onChange={handleInput} placeholder="e.g. Code Breakers" className={inputClass} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className={labelClass}>Thematic Area *</label>
                                                <Select value={form.thematicArea} onValueChange={v => setForm(p => ({ ...p, thematicArea: v as ThematicArea, category: '' }))}>
                                                    <SelectTrigger className={triggerClass}><SelectValue placeholder="Select thematic area" /></SelectTrigger>
                                                    <SelectContent className="bg-[#1e1e1e] border-white/10 text-white">
                                                        {(Object.keys(THEMATIC_AREAS) as ThematicArea[]).map(area => (
                                                            <SelectItem key={area} value={area} className="text-white focus:bg-white/10 focus:text-white">{area}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className={labelClass}>Category *</label>
                                                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))} disabled={!form.thematicArea}>
                                                    <SelectTrigger className={`${triggerClass} disabled:opacity-40`}><SelectValue placeholder={form.thematicArea ? 'Select category' : 'Select thematic area first'} /></SelectTrigger>
                                                    <SelectContent className="bg-[#1e1e1e] border-white/10 text-white">
                                                        <SelectGroup>
                                                            <SelectLabel className="text-white/40">{form.thematicArea}</SelectLabel>
                                                            {categories.map(cat => (
                                                                <SelectItem key={cat} value={cat} className="text-white focus:bg-white/10 focus:text-white">{cat}</SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </>}

                                    {step === 3 && <>
                                        <div>
                                            <p className="text-white font-semibold text-lg mb-1">Learner Names</p>
                                            <p className="text-white/40 text-sm">Add the students on your team — up to {MAX_LEARNERS}.</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {learners.map((learner, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <span className="text-white/30 text-xs font-mono w-4 text-center shrink-0">{i + 1}</span>
                                                    <Input value={learner} onChange={e => handleLearnerChange(i, e.target.value)}
                                                        placeholder={`Student ${i + 1} full name`} className={inputClass + ' flex-1'} />
                                                    {learners.length > 1 && (
                                                        <button type="button" onClick={() => removeLearner(i)}
                                                            className="w-9 h-9 shrink-0 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white/40"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {learners.length < MAX_LEARNERS && (
                                            <button type="button" onClick={addLearner}
                                                className="self-start flex items-center gap-1.5 text-[#8b7ff5] hover:text-[#a094f7] text-sm font-medium transition-colors">
                                                <span className="text-lg leading-none">+</span> Add another student
                                            </button>
                                        )}
                                        <p className="text-white/25 text-xs">{learners.filter(l => l.trim()).length} of {MAX_LEARNERS} students added</p>
                                    </>}

                                    {step === 4 && <>
                                        <div>
                                            <p className="text-white font-semibold text-lg mb-1">Review & Pay</p>
                                            <p className="text-white/40 text-sm">Everything correct? Complete your registration below.</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-sm">
                                            <Row label="School"   value={form.schoolName} />
                                            <Row label="Contact"  value={form.contactPerson} />
                                            <Row label="Email"    value={form.email} />
                                            <div className="border-t border-white/10" />
                                            <Row label="Team"     value={form.teamName} />
                                            <Row label="Domain"   value={form.thematicArea} />
                                            <Row label="Category" value={form.category} />
                                            <div className="border-t border-white/10" />
                                            <Row label="Students" value={learners.filter(l => l.trim()).join(', ')} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className={labelClass}>Coupon Code <span className="text-white/25 normal-case">(optional)</span></label>
                                            <Input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                                                placeholder="Enter code"
                                                className={inputClass + ' font-mono tracking-wider'} />
                                            <p className="text-white/25 text-xs">Have a coupon? No payment required.</p>
                                        </div>
                                        <button onClick={handlePay} disabled={loading}
                                            className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/25">
                                            {hasCoupon ? 'Redeem Coupon & Register' : `Pay KES ${ticketAmountKes} & Register`}
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
            <span className="text-white text-right truncate">{value || '—'}</span>
        </div>
    )
}
