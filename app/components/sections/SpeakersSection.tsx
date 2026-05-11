"use client";

import Carousel from "@/components/ui/carousel";

interface Speaker {
  _id: string;
  name: string;
  role: string;
  photo: string | null;
}

const FALLBACK_SPEAKERS = [
  {
    title: "TBA",
    button: "Keynote Speaker",
    src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=3387&auto=format&fit=crop",
  },
  {
    title: "TBA",
    button: "Tech Innovator",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=3388&auto=format&fit=crop",
  },
  {
    title: "TBA",
    button: "Education Leader",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=3540&auto=format&fit=crop",
  },
  {
    title: "TBA",
    button: "Industry Expert",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3461&auto=format&fit=crop",
  },
];

export default function SpeakersSection({ speakers }: { speakers: Speaker[] }) {
  const slides = speakers.length > 0
    ? speakers.map((s) => ({
        title: s.name,
        button: s.role,
        src: s.photo ?? FALLBACK_SPEAKERS[0].src,
      }))
    : FALLBACK_SPEAKERS;

  return (
    <section id="speakers" className="relative z-10 bg-background py-16 overflow-hidden">
      <div className="max-w-7xl px-4 mx-auto mb-10">
        <span className="text-white/40 text-xs uppercase tracking-widest">Featured Speakers</span>
      </div>
      <div className="relative w-full h-[70vmin] flex items-center justify-center">
        <Carousel slides={slides} />
      </div>
    </section>
  );
}
