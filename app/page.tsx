import { client } from '@/sanity/lib/client'
import { heroQuery, domainsSectionQuery, competitionCategoriesQuery, speakersQuery } from '@/sanity/lib/queries'
import Navbar from './components/sections/Navbar'
import Hero from './components/sections/Hero'
import Motto from './components/sections/Motto'
import FeaturesSectionDemo from '@/components/ui/features-section-demo-3'
import PartnersStrip from '@/components/infinite-moving-cards-demo'
import Footer from './components/sections/Footer'
import SponsorCTA from './components/sections/SponsorCTA'
import FestivalCountdown from './components/sections/FestivalCountdown'
import SpeakersSection from './components/sections/SpeakersSection'

// Fallback data when Sanity document hasn't been created yet
const fallbackHero = {
  title: 'Code Innovation Festival',
  eventDate: 'June 13, 2026',
  location: 'Khadija Comprehensive',
  format: 'Inter-School Competition',
  backgroundImage: null,
  primaryCta: 'Register Your School',
  secondaryCta: 'Learn More',
}

export default async function Home() {
  const [hero, domains, categories, speakers] = await Promise.all([
    client.fetch(heroQuery).catch(() => null),
    client.fetch(domainsSectionQuery).catch(() => null),
    client.fetch(competitionCategoriesQuery).catch(() => null),
    client.fetch(speakersQuery).catch(() => null),
  ])
  const data = hero || fallbackHero

  return (
    <main>
      <Navbar />
      <Hero
        title={data.title}
        eventDate={data.eventDate}
        location={data.location}
        format={data.format}
        backgroundImage={data.backgroundImage}
        primaryCta={data.primaryCta}
        secondaryCta={data.secondaryCta}
      />

      <FestivalCountdown />

      <Motto />

      <FeaturesSectionDemo
        educationImage={domains?.educationImage ?? null}
        healthVideoUrl={domains?.healthVideoUrl ?? null}
        technologicalImage={categories?.technologicalImage ?? null}
        problemSolvingImage={categories?.problemSolvingImage ?? null}
      />

      <SponsorCTA />

<SpeakersSection speakers={speakers ?? []} />

      <PartnersStrip />

      <Footer />
    </main>
  )
}