'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent,
    SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { completeRegistrationWithPayment } from '@/app/actions/completeRegistration'
import { redeemCouponAndRegister, redeemDiscountCouponWithPayment } from '@/app/actions/redeemCoupon'
import { lookupCoupon } from '@/app/actions/lookupCoupon'
import { getRegistrationFee } from '@/app/actions/getRegistrationFee'
import { CATEGORIES, THEMATIC_AREAS, MAX_OBSERVERS, learnerLimit } from '@/lib/registrationLimits'

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

const MAX_TEAMS = Infinity   // schools can register as many teams as they want
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!

const inputClass   = 'h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#8b7ff5] focus-visible:ring-[#8b7ff5]/20 rounded-xl text-sm'
const triggerClass = 'h-12 w-full bg-white/5 border-white/10 text-white data-placeholder:text-white/40 focus-visible:border-[#8b7ff5] focus-visible:ring-[#8b7ff5]/20 rounded-xl text-sm px-4'
const labelClass   = 'text-white/60 text-xs uppercase tracking-widest mb-1 block'

const STEPS = [
    { number: 1, title: 'School Info' },
    { number: 2, title: 'Teams' },
    { number: 3, title: 'Payment' },
]

type FieldDef = {
    key: string; label: string; hint: string
    type?: string; placeholder: string; required?: boolean
}

const STEP1_FIELDS: FieldDef[] = [
    { key: 'schoolName',    label: 'School Name',    hint: 'What school are you registering?', placeholder: 'e.g. Mombasa Academy',       required: true },
    { key: 'contactPerson', label: 'Contact Person', hint: 'Who should we contact?',            placeholder: 'Teacher / Coordinator name', required: true },
    { key: 'email',         label: 'Email Address',  hint: 'Where do we send your ticket?',     placeholder: 'school@example.com',          required: true, type: 'email' },
    { key: 'phone',         label: 'Phone Number',   hint: 'How can we reach you?',             placeholder: '+254 xxx xxx xxx',            required: true, type: 'tel' },
]

type Team = {
    teamName: string
    category: string
    thematicArea: string
    learners: string[]
}

function newTeam(): Team {
    return { teamName: '', category: '', thematicArea: '', learners: ['', ''] }
}

export default function RegisterPage() {
    const router = useRouter()

    const [step, setStep]             = useState(1)
    const [direction, setDirection]   = useState(1)
    const [fieldIndex, setFieldIndex] = useState(0)
    const [vpHeight, setVpHeight]     = useState('100dvh')
    const [vpTop, setVpTop]           = useState(0)

    const inputRef = useRef<HTMLInputElement>(null)

    const [form, setForm]   = useState({ schoolName: '', contactPerson: '', email: '', phone: '' })
    const [teams, setTeams] = useState<Team[]>([newTeam()])
    const [observers, setObservers] = useState<string[]>([])
    const [coupon, setCoupon]           = useState('')
    const [loading, setLoading]         = useState(false)
    const [statusMessage, setStatusMsg] = useState('')
    const [error, setError]             = useState<string | null>(null)
    const [feePerLearner, setFeePerLearner] = useState(1000)

    // Step-2 mobile sub-navigation:
    // s2FieldIdx: 0=team name, 1=category, 2=thematic area, 3=learners
    // s2AskAdd: "want to add another team?" interstitial screen
    const [s2TeamIdx, setS2TeamIdx]   = useState(0)
    const [s2FieldIdx, setS2FieldIdx] = useState(0)
    const [s2AskAdd, setS2AskAdd]     = useState(false)
    const [s2Observers, setS2Observers] = useState(false)

    useEffect(() => { getRegistrationFee().then(setFeePerLearner) }, [])

    const totalLearners = teams.reduce((s, t) => s + t.learners.filter(l => l.trim()).length, 0)
    const totalAmount   = totalLearners * feePerLearner
    const hasCoupon     = coupon.trim().length > 0

    useEffect(() => {
        const vv = window.visualViewport
        if (!vv) return
        const update = () => { setVpHeight(`${Math.round(vv.height)}px`); setVpTop(Math.round(vv.offsetTop)) }
        update()
        vv.addEventListener('resize', update)
        vv.addEventListener('scroll', update)
        return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
    }, [])

    // Auto-focus text inputs; depends on s2 sub-step so it fires on each field change
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 120)
    }, [fieldIndex, step, s2TeamIdx, s2FieldIdx])

    // Reset sub-navigation when step changes
    useEffect(() => {
        setFieldIndex(0)
        if (step === 2) { setS2TeamIdx(0); setS2FieldIdx(0); setS2AskAdd(false); setS2Observers(false) }
    }, [step])

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    }

    function setTeamField(ti: number, field: keyof Omit<Team, 'learners'>, value: string) {
        setTeams(prev => prev.map((t, i) => i === ti ? { ...t, [field]: value } : t))
    }
    function setLearner(ti: number, li: number, value: string) {
        setTeams(prev => prev.map((t, i) => i !== ti ? t : {
            ...t, learners: t.learners.map((l, j) => j === li ? value : l),
        }))
    }
    function addLearner(ti: number) {
        setTeams(prev => prev.map((t, i) => {
            if (i !== ti) return t
            const max = learnerLimit(t.category).max
            return t.learners.length >= max ? t : { ...t, learners: [...t.learners, ''] }
        }))
    }
    function removeLearner(ti: number, li: number) {
        setTeams(prev => prev.map((t, i) => i !== ti || t.learners.length <= 1 ? t : {
            ...t, learners: t.learners.filter((_, j) => j !== li),
        }))
    }
    function addTeam() { if (teams.length < MAX_TEAMS) setTeams(p => [...p, newTeam()]) }
    function removeTeam(ti: number) { if (teams.length > 1) setTeams(p => p.filter((_, i) => i !== ti)) }

    // Observers — school-wide, not charged, capped at MAX_OBSERVERS
    function addObserver()                 { setObservers(p => p.length >= MAX_OBSERVERS ? p : [...p, '']) }
    function setObserver(i: number, v: string) { setObservers(p => p.map((o, j) => j === i ? v : o)) }
    function removeObserver(i: number)     { setObservers(p => p.filter((_, j) => j !== i)) }

    function getPayload() {
        return {
            schoolName: form.schoolName,
            contactPerson: form.contactPerson,
            email: form.email,
            phone: form.phone,
            teams: teams.map(t => ({
                teamName: t.teamName,
                category: t.category,
                thematicArea: t.thematicArea,
                learnerNames: t.learners.filter(l => l.trim()),
            })),
            observerNames: observers.filter(o => o.trim()),
        }
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

    function validateS2Field(): string | null {
        const t = teams[s2TeamIdx]
        if (!t) return null
        if (s2FieldIdx === 0 && !t.teamName.trim())  return 'Team name is required.'
        if (s2FieldIdx === 1 && !t.category)          return 'Please select a category.'
        if (s2FieldIdx === 2 && !t.thematicArea)      return 'Please select a thematic area.'
        if (s2FieldIdx === 3) {
            const lim = learnerLimit(t.category)
            const filled = t.learners.filter(l => l.trim()).length
            if (filled < lim.min) return `Add at least ${lim.min} learners for ${t.category}.`
            if (filled > lim.max) return `Maximum ${lim.max} learners for ${t.category}.`
        }
        return null
    }

    function validateStep(): string | null {
        if (step === 1) {
            if (!form.schoolName.trim())    return 'School name is required.'
            if (!form.contactPerson.trim()) return 'Contact person is required.'
            if (!form.email.trim())         return 'Email address is required.'
            if (!form.phone.trim())         return 'Phone number is required.'
        }
        if (step === 2) {
            for (let i = 0; i < teams.length; i++) {
                const t = teams[i]; const n = i + 1
                if (!t.teamName.trim())    return `Team ${n}: team name is required.`
                if (!t.category)            return `Team ${n}: please select a category.`
                if (!t.thematicArea)        return `Team ${n}: please select a thematic area.`
                const lim = learnerLimit(t.category)
                const filled = t.learners.filter(l => l.trim()).length
                if (filled < lim.min) return `Team ${n}: add at least ${lim.min} learners.`
                if (filled > lim.max) return `Team ${n}: maximum ${lim.max} learners for ${t.category}.`
            }
        }
        return null
    }

    const mobileFields      = step === 1 ? STEP1_FIELDS : []
    const isLastMobileField = fieldIndex >= mobileFields.length - 1
    const currentField      = mobileFields[fieldIndex]

    // Progress: 0–1 across all steps
    const stepBase = (step - 1) / STEPS.length
    const subFrac  = step === 1
        ? fieldIndex / STEP1_FIELDS.length
        : step === 2
            ? (s2AskAdd ? s2TeamIdx * 4 + 4 : s2TeamIdx * 4 + s2FieldIdx) / Math.max(teams.length * 4, 4)
            : 0
    const globalProgress = stepBase + subFrac / STEPS.length

    function mobileNext() {
        setError(null)
        if (step === 1) {
            if (currentField) {
                const err = validateField(currentField)
                if (err) { setError(err); return }
            }
            if (!isLastMobileField) { setDirection(1); setFieldIndex(f => f + 1) }
            else goNextStep()
        } else if (step === 2 && s2Observers) {
            goNextStep()
        } else if (step === 2 && !s2AskAdd) {
            const err = validateS2Field()
            if (err) { setError(err); return }
            if (s2FieldIdx < 3) {
                setDirection(1); setS2FieldIdx(f => f + 1)
            } else {
                if (s2TeamIdx < teams.length - 1) {
                    setDirection(1); setS2TeamIdx(i => i + 1); setS2FieldIdx(0)
                } else if (teams.length < MAX_TEAMS) {
                    setDirection(1); setS2AskAdd(true)
                } else {
                    setDirection(1); setS2Observers(true)
                }
            }
        }
    }

    function mobileBack() {
        setError(null)
        if (step === 1) {
            if (fieldIndex > 0) { setDirection(-1); setFieldIndex(f => f - 1) }
            else goPrevStep()
        } else if (step === 2) {
            if (s2Observers) {
                setDirection(-1); setS2Observers(false)
                if (teams.length < MAX_TEAMS) { setS2AskAdd(true) }
                else { setS2TeamIdx(teams.length - 1); setS2FieldIdx(3) }
            } else if (s2AskAdd) {
                setDirection(-1); setS2AskAdd(false)
            } else if (s2FieldIdx > 0) {
                setDirection(-1); setS2FieldIdx(f => f - 1)
            } else if (s2TeamIdx > 0) {
                setDirection(-1); setS2TeamIdx(i => i - 1); setS2FieldIdx(3)
            } else {
                goPrevStep()
            }
        } else {
            goPrevStep()
        }
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

        const info = await lookupCoupon(coupon)
        if (!info.ok) {
            setLoading(false); setStatusMsg(''); setError(info.error)
            return
        }

        // Free coupon → register immediately, no payment
        if (info.type === 'free') {
            const result = await redeemCouponAndRegister(coupon, getPayload())
            if (result.success && result.ticketId && result.token) {
                handleSuccess(result.ticketId, result.token)
            } else {
                setLoading(false); setStatusMsg(''); setError(result.error ?? 'Coupon redemption failed.')
            }
            return
        }

        // Discount coupon → pay the discounted rate via Paystack
        if (!window.PaystackPop) {
            setLoading(false); setStatusMsg(''); setError('Payment widget still loading. Try again.')
            return
        }
        if (totalLearners < 1) {
            setLoading(false); setStatusMsg(''); setError('No learners added.')
            return
        }

        const discountedTotal = info.feePerLearnerKes * totalLearners
        setLoading(false); setStatusMsg('')

        const bytes = new Uint8Array(12); crypto.getRandomValues(bytes)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const rand  = Array.from(bytes).map(b => chars[b % chars.length]).join('')

        window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY, email: form.email,
            amount: discountedTotal * 100, currency: 'KES',
            ref: `CPN-${rand}`,
            metadata: { schoolName: form.schoolName, contactPerson: form.contactPerson, teamCount: teams.length, totalLearners, coupon: coupon.trim().toUpperCase() },
            callback(response) {
                setLoading(true); setStatusMsg('Payment confirmed! Saving your registration…')
                redeemDiscountCouponWithPayment(coupon, response.reference, getPayload()).then(result => {
                    if (result.success && result.ticketId && result.token) {
                        handleSuccess(result.ticketId, result.token)
                    } else {
                        setLoading(false); setStatusMsg(''); setError(result.error ?? 'Something went wrong.')
                    }
                })
            },
            onClose() { setLoading(false); setStatusMsg('') },
        }).openIframe()
    }

    function handlePay() {
        setError(null)
        if (hasCoupon) { handleCouponSubmit(); return }
        if (!window.PaystackPop) { setError('Payment widget still loading. Try again.'); return }
        if (totalLearners < 1) { setError('No learners added.'); return }

        const bytes = new Uint8Array(12); crypto.getRandomValues(bytes)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const rand  = Array.from(bytes).map(b => chars[b % chars.length]).join('')

        window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY, email: form.email,
            amount: totalAmount * 100, currency: 'KES',
            ref: `REG-${rand}`,
            metadata: { schoolName: form.schoolName, contactPerson: form.contactPerson, teamCount: teams.length, totalLearners },
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
                        <span className={`text-[10px] uppercase tracking-widest transition-colors ${step === s.number ? 'text-white/70' : 'text-white/25'}`}>{s.title}</span>
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

    // Animation key changes on every mobile sub-step so AnimatePresence fires correctly
    const mobileKey = step === 2
        ? `2-${s2TeamIdx}-${s2FieldIdx}-${s2AskAdd}-${s2Observers}`
        : `${step}-${fieldIndex}`

    // Convenience shorthand for the current team on step 2
    const ct = teams[s2TeamIdx] ?? newTeam()

    return (
        <>
            <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
            {loading && <LoadingOverlay />}

            {/* ═══════════════════════════════════════════════════
                MOBILE — one field/screen at a time for all steps
                ═══════════════════════════════════════════════════ */}
            <div className="md:hidden bg-background flex flex-col"
                style={{ position: 'fixed', left: 0, right: 0, top: vpTop, height: vpHeight }}>

                {/* Top bar */}
                <div className="shrink-0 px-5 pt-5 pb-3">
                    <div className="w-full h-1 bg-white/10 rounded-full mb-5 overflow-hidden">
                        <motion.div className="h-full bg-[#8b7ff5] rounded-full"
                            animate={{ width: `${Math.max(5, Math.round(globalProgress * 100))}%` }}
                            transition={{ duration: 0.4 }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {(step > 1 || fieldIndex > 0 || (step === 2 && (s2FieldIdx > 0 || s2TeamIdx > 0 || s2AskAdd || s2Observers))) && (
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

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto px-5">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div key={mobileKey} custom={direction} variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="pt-10 pb-6">

                            {/* ── Step 1: one school field at a time ── */}
                            {step === 1 && currentField && (
                                <>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">
                                        {currentField.label}{currentField.required && <span className="text-[#8b7ff5] ml-1">*</span>}
                                    </p>
                                    <p className="text-white/40 text-base mb-8">{currentField.hint}</p>
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
                                </>
                            )}

                            {/* ── Step 2, field 0: Team Name ── */}
                            {step === 2 && !s2AskAdd && s2FieldIdx === 0 && (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <p className="text-white/40 text-xs uppercase tracking-widest">Team {s2TeamIdx + 1}</p>
                                        {s2TeamIdx > 0 && (
                                            <button onClick={() => {
                                                removeTeam(s2TeamIdx)
                                                setDirection(-1)
                                                setS2TeamIdx(i => i - 1)
                                                setS2FieldIdx(3)
                                            }} className="text-white/30 hover:text-red-400 text-xs transition-colors">
                                                Remove team
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">
                                        Team Name <span className="text-[#8b7ff5]">*</span>
                                    </p>
                                    <p className="text-white/40 text-base mb-8">What will this team be called?</p>
                                    <input
                                        ref={inputRef}
                                        value={ct.teamName}
                                        onChange={e => setTeamField(s2TeamIdx, 'teamName', e.target.value)}
                                        placeholder="e.g. Code Breakers"
                                        onKeyDown={e => e.key === 'Enter' && mobileNext()}
                                        className="w-full h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                    />
                                </>
                            )}

                            {/* ── Step 2, field 1: Category ── */}
                            {step === 2 && !s2AskAdd && s2FieldIdx === 1 && (
                                <>
                                    <p className="text-white/40 text-xs uppercase tracking-widest mb-6">Team {s2TeamIdx + 1} — {ct.teamName}</p>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">
                                        Category <span className="text-[#8b7ff5]">*</span>
                                    </p>
                                    <p className="text-white/40 text-base mb-8">Which category does your project fall under?</p>
                                    <Select value={ct.category} onValueChange={v => setTeamField(s2TeamIdx, 'category', v)}>
                                        <SelectTrigger className="h-14 w-full bg-white/5 border border-white/10 text-white rounded-2xl text-base px-4 focus:border-[#8b7ff5]">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e1e1e] border-white/10 text-white" style={{ minWidth: 'var(--radix-select-trigger-width)' }}>
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c} value={c} className="text-white focus:bg-white/10 focus:text-white text-base py-3">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            )}

                            {/* ── Step 2, field 2: Thematic Area ── */}
                            {step === 2 && !s2AskAdd && s2FieldIdx === 2 && (
                                <>
                                    <p className="text-white/40 text-xs uppercase tracking-widest mb-6">Team {s2TeamIdx + 1} — {ct.teamName}</p>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">
                                        Thematic Area <span className="text-[#8b7ff5]">*</span>
                                    </p>
                                    <p className="text-white/40 text-base mb-8">What problem area does your project address?</p>
                                    <Select value={ct.thematicArea} onValueChange={v => setTeamField(s2TeamIdx, 'thematicArea', v)}>
                                        <SelectTrigger className="h-14 w-full bg-white/5 border border-white/10 text-white rounded-2xl text-base px-4 focus:border-[#8b7ff5]">
                                            <SelectValue placeholder="Select thematic area" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e1e1e] border-white/10 text-white" style={{ minWidth: 'var(--radix-select-trigger-width)' }}>
                                            {THEMATIC_AREAS.map(a => (
                                                <SelectItem key={a} value={a} className="text-white focus:bg-white/10 focus:text-white text-base py-3">{a}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            )}

                            {/* ── Step 2, field 3: Learner Names ── */}
                            {step === 2 && !s2AskAdd && s2FieldIdx === 3 && (
                                <>
                                    <p className="text-white/40 text-xs uppercase tracking-widest mb-6">Team {s2TeamIdx + 1} — {ct.teamName}</p>
                                    <p className="text-white font-display text-2xl font-semibold leading-tight mb-1">
                                        Learner Names <span className="text-[#8b7ff5]">*</span>
                                    </p>
                                    <p className="text-white/40 text-sm mb-6">Add the students on this team — {learnerLimit(ct.category).min} to {learnerLimit(ct.category).max} for {ct.category}.</p>
                                    <div className="flex flex-col gap-3">
                                        {ct.learners.map((learner, li) => (
                                            <div key={li} className="flex items-center gap-3">
                                                <span className="text-white/30 text-sm font-mono w-5 text-center shrink-0">{li + 1}</span>
                                                <input
                                                    ref={li === 0 ? inputRef : undefined}
                                                    value={learner}
                                                    onChange={e => setLearner(s2TeamIdx, li, e.target.value)}
                                                    placeholder={`Student ${li + 1} full name`}
                                                    className="flex-1 h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                                />
                                                {ct.learners.length > 1 && (
                                                    <button type="button" onClick={() => removeLearner(s2TeamIdx, li)}
                                                        className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {ct.learners.length < learnerLimit(ct.category).max && (
                                        <button type="button" onClick={() => addLearner(s2TeamIdx)}
                                            className="mt-4 flex items-center gap-2 text-[#8b7ff5] hover:text-[#a094f7] text-sm font-medium transition-colors">
                                            <span className="text-xl leading-none">+</span> Add another student
                                        </button>
                                    )}
                                    <p className="mt-3 text-white/25 text-xs">{ct.learners.filter(l => l.trim()).length} / {learnerLimit(ct.category).max} learners added</p>
                                </>
                            )}

                            {/* ── Step 2 interstitial: Add another team? ── */}
                            {step === 2 && s2AskAdd && (
                                <>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">Add another team?</p>
                                    <p className="text-white/40 text-base mb-6">
                                        You have {teams.length} team{teams.length > 1 ? 's' : ''} so far. You can register as many as you like.
                                    </p>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                                        {teams.map((t, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                <span className="text-white/30 w-16 shrink-0">Team {i + 1}</span>
                                                <span className="text-white/70 truncate">{t.teamName}</span>
                                                <span className="text-white/30 ml-auto shrink-0">{t.learners.filter(l => l.trim()).length} learner{t.learners.filter(l => l.trim()).length !== 1 ? 's' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* ── Step 2: Observers (school-wide, not charged) ── */}
                            {step === 2 && s2Observers && (
                                <>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">Observers</p>
                                    <p className="text-white/40 text-base mb-6">
                                        Students who&apos;ll attend but aren&apos;t competing — <span className="text-white/70">not charged</span>. Up to {MAX_OBSERVERS} per school. Optional.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        {observers.map((obs, oi) => (
                                            <div key={oi} className="flex items-center gap-3">
                                                <span className="text-white/30 text-sm font-mono w-5 text-center shrink-0">{oi + 1}</span>
                                                <input
                                                    ref={oi === 0 ? inputRef : undefined}
                                                    value={obs}
                                                    onChange={e => setObserver(oi, e.target.value)}
                                                    placeholder={`Observer ${oi + 1} full name`}
                                                    className="flex-1 h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 focus:outline-none focus:border-[#8b7ff5] transition-colors"
                                                />
                                                <button type="button" onClick={() => removeObserver(oi)}
                                                    className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {observers.length < MAX_OBSERVERS && (
                                        <button type="button" onClick={addObserver}
                                            className="mt-4 flex items-center gap-2 text-[#8b7ff5] hover:text-[#a094f7] text-sm font-medium transition-colors">
                                            <span className="text-xl leading-none">+</span> Add Observer
                                        </button>
                                    )}
                                    <p className="mt-3 text-white/25 text-xs">{observers.filter(o => o.trim()).length} / {MAX_OBSERVERS} observers added</p>
                                </>
                            )}

                            {/* ── Step 3: Review & Pay ── */}
                            {step === 3 && (
                                <>
                                    <p className="text-white font-display text-3xl font-semibold leading-tight mb-2">Review & Pay</p>
                                    <p className="text-white/40 text-base mb-6">Everything looks good? Complete your registration.</p>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-sm mb-4">
                                        <Row label="School"  value={form.schoolName} />
                                        <Row label="Contact" value={form.contactPerson} />
                                        <Row label="Email"   value={form.email} />
                                        <Row label="Phone"   value={form.phone} />
                                        <div className="border-t border-white/10" />
                                        {teams.map((t, i) => (
                                            <div key={i}>
                                                <p className="text-white/40 text-xs uppercase tracking-widest mb-2 mt-1">Team {i + 1}</p>
                                                <div className="flex flex-col gap-1.5">
                                                    <Row label="Name"     value={t.teamName} />
                                                    <Row label="Category" value={t.category} />
                                                    <Row label="Domain"   value={t.thematicArea} />
                                                    <Row label="Learners" value={t.learners.filter(l => l.trim()).join(', ')} />
                                                </div>
                                                {i < teams.length - 1 && <div className="border-t border-white/10 mt-3" />}
                                            </div>
                                        ))}
                                        {observers.filter(o => o.trim()).length > 0 && (
                                            <>
                                                <div className="border-t border-white/10" />
                                                <Row label="Observers (free)" value={observers.filter(o => o.trim()).join(', ')} />
                                            </>
                                        )}
                                        <div className="border-t border-white/10" />
                                        <Row label="Total Learners" value={String(totalLearners)} />
                                        <Row label="Total Amount"   value={`KES ${totalAmount.toLocaleString()}`} />
                                    </div>
                                    <div className="flex flex-col gap-2 mb-2">
                                        <label className={labelClass}>Coupon Code <span className="text-white/25 normal-case">(optional)</span></label>
                                        <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="w-full h-14 bg-white/5 border border-white/10 text-white text-base placeholder:text-white/25 rounded-2xl px-4 font-mono tracking-wider focus:outline-none focus:border-[#8b7ff5] transition-colors" />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-sm px-1 -mt-2 mb-4">{error}</motion.p>
                    )}
                </div>

                {/* Bottom button(s) */}
                <div className="shrink-0 px-5 pb-5 pt-3 border-t border-white/5">
                    {step === 3 ? (
                        <button onClick={handlePay} disabled={loading}
                            className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/25">
                            {hasCoupon ? 'Redeem Coupon & Register' : `Pay KES ${totalAmount.toLocaleString()} & Register`}
                        </button>
                    ) : step === 2 && s2AskAdd ? (
                        <div className="flex flex-col gap-3">
                            <button onClick={() => {
                                const ni = teams.length
                                addTeam()
                                setS2TeamIdx(ni)
                                setS2FieldIdx(0)
                                setS2AskAdd(false)
                                setDirection(1)
                            }} className="w-full py-4 rounded-2xl border border-[#8b7ff5] text-[#8b7ff5] font-bold text-base transition-all">
                                + Register Team {teams.length + 1}
                            </button>
                            <button onClick={() => { setDirection(1); setS2AskAdd(false); setS2Observers(true) }}
                                className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/30">
                                Continue →
                            </button>
                        </div>
                    ) : (
                        <button onClick={mobileNext}
                            className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/30">
                            {(step === 1 && isLastMobileField) || (step === 2 && s2FieldIdx === 3) ? 'Continue →' : 'Next →'}
                        </button>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                DESKTOP — all fields per step visible at once
                ═══════════════════════════════════════════════════ */}
            <div className="hidden md:flex flex-col min-h-screen bg-background overflow-x-hidden">
                <Navbar />
                <main className="flex-1 w-full px-4 sm:px-6 md:px-12 lg:px-16 pt-24 sm:pt-28 pb-24">
                    <div className="mb-12">
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-white">
                            Register Your<br />School
                        </h1>
                        <p className="mt-4 text-white/50 text-sm sm:text-base max-w-md">
                            Registration fee: <span className="text-white font-semibold">KES {feePerLearner.toLocaleString()} per learner</span>.
                            Register as many teams as you like — 2 to 5 learners each depending on category.
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
                                            <p className="text-white font-semibold text-lg mb-1">Teams & Learners</p>
                                            <p className="text-white/40 text-sm">Add as many teams as you like. Each team picks one category and one thematic area.</p>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {teams.map((team, ti) => (
                                                <TeamCard key={ti} team={team} ti={ti} teamCount={teams.length}
                                                    onRemove={removeTeam}
                                                    onFieldChange={setTeamField}
                                                    onLearnerChange={setLearner}
                                                    onAddLearner={addLearner}
                                                    onRemoveLearner={removeLearner}
                                                />
                                            ))}
                                        </div>
                                        {teams.length < MAX_TEAMS && (
                                            <button type="button" onClick={addTeam}
                                                className="self-start flex items-center gap-1.5 text-[#8b7ff5] hover:text-[#a094f7] text-sm font-medium transition-colors">
                                                <span className="text-lg leading-none">+</span> Add another team
                                            </button>
                                        )}

                                        {/* Observers — school-wide, not charged */}
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                                            <div>
                                                <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-1">Observers</p>
                                                <p className="text-white/40 text-xs">Students who attend but don&apos;t compete — <span className="text-white/70">not charged</span>. Up to {MAX_OBSERVERS} per school.</p>
                                            </div>
                                            {observers.map((obs, oi) => (
                                                <div key={oi} className="flex items-center gap-2">
                                                    <span className="text-white/30 text-xs font-mono w-4 text-center shrink-0">{oi + 1}</span>
                                                    <input value={obs} onChange={e => setObserver(oi, e.target.value)}
                                                        placeholder={`Observer ${oi + 1} full name`}
                                                        className="flex-1 h-10 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 rounded-xl px-3 focus:outline-none focus:border-[#8b7ff5] transition-colors" />
                                                    <button type="button" onClick={() => removeObserver(oi)}
                                                        className="w-8 h-8 shrink-0 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white/40"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {observers.length < MAX_OBSERVERS && (
                                                <button type="button" onClick={addObserver}
                                                    className="self-start flex items-center gap-1 text-[#8b7ff5] hover:text-[#a094f7] text-xs font-medium transition-colors mt-1">
                                                    <span className="text-sm leading-none">+</span> Add Observers
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-white/25 text-xs">
                                            {teams.length} team{teams.length !== 1 ? 's' : ''} · {totalLearners} learner{totalLearners !== 1 ? 's' : ''} · Total: KES {totalAmount.toLocaleString()}
                                        </p>
                                    </>}

                                    {step === 3 && <>
                                        <div>
                                            <p className="text-white font-semibold text-lg mb-1">Review & Pay</p>
                                            <p className="text-white/40 text-sm">Everything correct? Complete your registration below.</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-sm">
                                            <Row label="School"  value={form.schoolName} />
                                            <Row label="Contact" value={form.contactPerson} />
                                            <Row label="Email"   value={form.email} />
                                            <Row label="Phone"   value={form.phone} />
                                            <div className="border-t border-white/10" />
                                            {teams.map((t, i) => (
                                                <div key={i}>
                                                    <p className="text-white/40 text-xs uppercase tracking-widest mb-2 mt-1">Team {i + 1}</p>
                                                    <div className="flex flex-col gap-1.5">
                                                        <Row label="Name"     value={t.teamName} />
                                                        <Row label="Category" value={t.category} />
                                                        <Row label="Domain"   value={t.thematicArea} />
                                                        <Row label="Learners" value={t.learners.filter(l => l.trim()).join(', ')} />
                                                    </div>
                                                    {i < teams.length - 1 && <div className="border-t border-white/10 mt-3" />}
                                                </div>
                                            ))}
                                            {observers.filter(o => o.trim()).length > 0 && (
                                                <>
                                                    <div className="border-t border-white/10" />
                                                    <Row label="Observers (free)" value={observers.filter(o => o.trim()).join(', ')} />
                                                </>
                                            )}
                                            <div className="border-t border-white/10" />
                                            <Row label="Total Learners" value={String(totalLearners)} />
                                            <Row label="Total Amount"   value={`KES ${totalAmount.toLocaleString()}`} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className={labelClass}>Coupon Code <span className="text-white/25 normal-case">(optional)</span></label>
                                            <Input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                                                placeholder="Enter code" className={inputClass + ' font-mono tracking-wider'} />
                                            <p className="text-white/25 text-xs">Have a coupon? Apply it at checkout — free coupons skip payment, discount coupons charge the reduced rate.</p>
                                        </div>
                                        <button onClick={handlePay} disabled={loading}
                                            className="w-full py-4 rounded-2xl bg-[#8b7ff5] hover:bg-[#7a6ee0] disabled:opacity-50 text-white font-bold text-base transition-all shadow-lg shadow-[#8b7ff5]/25">
                                            {hasCoupon ? 'Redeem Coupon & Register' : `Pay KES ${totalAmount.toLocaleString()} & Register`}
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

type TeamCardProps = {
    team: Team
    ti: number
    teamCount: number
    onRemove: (ti: number) => void
    onFieldChange: (ti: number, field: keyof Omit<Team, 'learners'>, value: string) => void
    onLearnerChange: (ti: number, li: number, value: string) => void
    onAddLearner: (ti: number) => void
    onRemoveLearner: (ti: number, li: number) => void
}

function TeamCard({ team, ti, teamCount, onRemove, onFieldChange, onLearnerChange, onAddLearner, onRemoveLearner }: TeamCardProps) {
    const lim = learnerLimit(team.category)
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs uppercase tracking-widest font-medium">Team {ti + 1}</span>
                {teamCount > 1 && (
                    <button type="button" onClick={() => onRemove(ti)}
                        className="text-white/30 hover:text-red-400 text-xs transition-colors">Remove</button>
                )}
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Team Name *</label>
                    <input value={team.teamName} onChange={e => onFieldChange(ti, 'teamName', e.target.value)}
                        placeholder="e.g. Code Breakers"
                        className="w-full h-12 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 rounded-xl px-4 focus:outline-none focus:border-[#8b7ff5] transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Category *</label>
                    <Select value={team.category} onValueChange={v => onFieldChange(ti, 'category', v)}>
                        <SelectTrigger className={triggerClass}><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent className="bg-[#1e1e1e] border-white/10 text-white">
                            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white focus:bg-white/10 focus:text-white">{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Thematic Area *</label>
                    <Select value={team.thematicArea} onValueChange={v => onFieldChange(ti, 'thematicArea', v)}>
                        <SelectTrigger className={triggerClass}><SelectValue placeholder="Select thematic area" /></SelectTrigger>
                        <SelectContent className="bg-[#1e1e1e] border-white/10 text-white">
                            {THEMATIC_AREAS.map(a => <SelectItem key={a} value={a} className="text-white focus:bg-white/10 focus:text-white">{a}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className={labelClass}>
                        Learner Names * <span className="text-white/25 normal-case">({team.learners.filter(l => l.trim()).length}/{lim.max})</span>
                    </label>
                    {team.learners.map((learner, li) => (
                        <div key={li} className="flex items-center gap-2">
                            <span className="text-white/30 text-xs font-mono w-4 text-center shrink-0">{li + 1}</span>
                            <input value={learner} onChange={e => onLearnerChange(ti, li, e.target.value)}
                                placeholder={`Student ${li + 1} full name`}
                                className="flex-1 h-10 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 rounded-xl px-3 focus:outline-none focus:border-[#8b7ff5] transition-colors" />
                            {team.learners.length > 1 && (
                                <button type="button" onClick={() => onRemoveLearner(ti, li)}
                                    className="w-8 h-8 shrink-0 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white/40"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                    {team.learners.length < lim.max && (
                        <button type="button" onClick={() => onAddLearner(ti)}
                            className="self-start flex items-center gap-1 text-[#8b7ff5] hover:text-[#a094f7] text-xs font-medium transition-colors mt-1">
                            <span className="text-sm leading-none">+</span> Add learner
                        </button>
                    )}
                    <p className="text-white/25 text-[11px]">
                        {team.category ? `${lim.min}–${lim.max} learners for ${team.category}` : 'Pick a category to set the learner range'}
                    </p>
                </div>
            </div>
        </div>
    )
}
