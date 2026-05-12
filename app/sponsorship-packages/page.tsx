import Link from 'next/link'
import Navbar from '@/app/components/sections/Navbar'
import Footer from '@/app/components/sections/Footer'

export const metadata = {
    title: 'Sponsorship Packages — Code Innovation Festival',
    description: 'Explore sponsorship tiers for the Code Innovation Festival and partner with us to empower young African tech innovators.',
}

const packages = [
    {
        tier: 'Title Sponsor',
        price: 'KES 5,000,000',
        color: '#FFD700',
        featured: true,
        description: 'It caters for both the hackathon and the Code Innovators Festival. This exclusive partner will have their name and logo prominently featured as the official "Title Sponsor" across all event branding, including the main stage, all digital and physical materials, and dedicated media spotlights. This package includes a prime keynote speaker slot at the opening or closing ceremony, exclusive branding on all participant kits, merchandise, and awards, and a premium, oversized exhibition space.',
    },
    {
        tier: 'Platinum Innovator',
        price: 'KES 1,000,000',
        color: '#8b7ff5',
        description: 'It covers both the hackathon and the Code Innovators Festival, providing prominent branding across all event materials, media, and stage presence. This includes a keynote speaker slot, exclusive branding on participant kits and merchandise, a dedicated exhibition space, involvement in the judging panel, and collaboration on joint press releases and social media campaigns.',
    },
    {
        tier: 'Gold Creator',
        price: 'KES 700,000',
        color: '#f5c842',
        description: 'It caters for both the hackathon and the Code Innovators Festival, offering high-visibility branding across all event materials and media, a speaking opportunity during a dedicated segment, a prominent exhibition space, and inclusion in all event press releases.',
    },
    {
        tier: 'Silver Builder',
        price: 'KES 400,000',
        color: '#a8a9ad',
        description: "You'll receive branding on selected event materials, recognition during the ceremony, exhibition space, and social media mentions.",
    },
]

export default function SponsorshipPackagesPage() {
    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 px-4 sm:px-6 md:px-12 lg:px-16 pt-36 pb-24">
                {/* Header */}
                <div className="mb-16">
                    <span className="text-white/50 text-xs sm:text-sm uppercase tracking-widest mb-4 block">
                        Partner with us
                    </span>
                    <h1 className="font-display text-[clamp(2.8rem,7vw,7rem)] font-semibold leading-[1] tracking-tight text-white mb-6">
                        Sponsorship<br />Packages
                    </h1>
                    <p className="text-white/60 text-base sm:text-lg max-w-2xl leading-relaxed">
                        Choose the partnership level that fits your organisation. All packages support young innovators across Mombasa's schools.
                    </p>
                </div>

                {/* Package cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.tier}
                            className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 ${
                                pkg.featured
                                    ? 'border-white/20 bg-white/5'
                                    : 'border-white/10 bg-white/5'
                            }`}
                            style={pkg.featured ? { borderColor: pkg.color + '50' } : {}}
                        >
                            {pkg.featured && (
                                <span className="absolute -top-3 left-7 text-black text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: pkg.color }}>
                                    Premier
                                </span>
                            )}

                            <div className="flex items-start justify-between gap-4 mb-4">
                                <h2
                                    className="font-display text-2xl font-bold"
                                    style={{ color: pkg.color }}
                                >
                                    {pkg.tier}
                                </h2>
                                <p className="text-white text-lg font-bold shrink-0">{pkg.price}</p>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed flex-1 mb-6">
                                {pkg.description}
                            </p>

                            <Link
                                href="/sponsor"
                                className="block text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border"
                                style={{
                                    backgroundColor: pkg.featured ? pkg.color : 'transparent',
                                    color: pkg.featured ? '#000' : pkg.color,
                                    borderColor: pkg.color + '66',
                                }}
                            >
                                Get Started
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Custom CTA */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <h3 className="font-display text-2xl font-semibold text-white mb-2">Need a custom package?</h3>
                        <p className="text-white/50 text-sm">We're happy to tailor a partnership that works for your brand and budget.</p>
                    </div>
                    <Link
                        href="/sponsor"
                        className="shrink-0 inline-flex items-center bg-[#8b7ff5]/70 hover:bg-[#8b7ff5] text-white font-semibold px-7 py-3 rounded-full text-sm transition-all duration-200 backdrop-blur-sm"
                    >
                        Contact Us
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    )
}
