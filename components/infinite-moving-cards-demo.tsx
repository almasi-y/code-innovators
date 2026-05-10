"use client";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const LOGOS = Array.from({ length: 20 }, (_, i) => ({
  src: `/${i + 1}.svg`,
  alt: `Partner ${i + 1}`,
}));

export default function PartnersStrip() {
  return (
    <section className="relative z-10 bg-background py-16">
      <div className="max-w-7xl px-4 mx-auto mb-10">
        <span className="text-white/40 text-xs uppercase tracking-widest">Our Partners</span>
      </div>
      <InfiniteMovingCards items={LOGOS} direction="left" speed="fast" />
    </section>
  );
}
