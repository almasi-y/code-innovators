"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const navLinks = [
    { label: 'Schedule', href: '#schedule' },
    { label: 'Speakers', href: '#speakers' },
    { label: 'FAQs', href: '#faqs' },
    { label: 'Resources', href: '#resources' },
]

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <>
            <nav className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-12 py-2">
                <div className="flex items-center justify-between">
                    {/* Left side: logo + nav links */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center shrink-0">
                            <Image src="/logo.svg" alt="Logo" width={170} height={170} className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] md:w-[110px] md:h-[110px]" />
                        </Link>
                        <ul className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-base font-medium text-white hover:text-white/70 transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA Buttons — desktop only */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/register"
                            className="inline-flex items-center px-6 py-3 rounded-[1.2rem] bg-[#8b7ff5]/70 hover:bg-[#8b7ff5] text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-[#8b7ff5]/20 backdrop-blur-sm"
                        >
                            Buy tickets
                        </Link>
                    </div>

                    {/* Hamburger — mobile only */}
                    <button
                        className="md:hidden flex flex-col gap-[6px] p-2"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <span className="block w-7 h-[2.5px] bg-white rounded-full" />
                        <span className="block w-7 h-[2.5px] bg-white rounded-full" />
                        <span className="block w-7 h-[2.5px] bg-white rounded-full" />
                    </button>
                </div>
            </nav>

            {/* Full-page mobile overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col px-6 pt-5 pb-10"
                    >
                        {/* Top row: logo + close */}
                        <div className="flex items-center justify-between mb-12">
                            <Link href="/" onClick={() => setMenuOpen(false)}>
                                <Image src="/logo.svg" alt="Logo" width={100} height={100} className="w-[80px] h-[80px]" />
                            </Link>
                            <button
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                                className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M1 1L17 17M17 1L1 17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        {/* Nav links */}
                        <ul className="flex flex-col gap-2 flex-1">
                            {navLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setMenuOpen(false)}
                                        className="block text-4xl font-bold text-white py-3 border-b border-white/10"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* CTA Buttons at bottom */}
                        <div className="flex flex-col gap-3 mt-8">
                            <Link
                                href="/register"
                                onClick={() => setMenuOpen(false)}
                                className="w-full text-center py-4 rounded-[1.2rem] bg-[#8b7ff5] text-white text-base font-semibold"
                            >
                                Buy tickets
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
