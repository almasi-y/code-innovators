"use client";
import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import {
  Smartphone, Film, Gamepad2, Bot,
  GraduationCap, ShieldCheck, HeartPulse, Leaf,
} from "lucide-react";

type Props = {
  educationImage?: string | null;
  healthVideoUrl?: string | null;
  technologicalImage?: string | null;
  problemSolvingImage?: string | null;
};

type BulletItem = { text: string; Icon: React.ElementType };

const CategoryContent = ({ bullets }: { bullets: BulletItem[] }) => (
  <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
    <ul className="flex flex-col gap-5">
      {bullets.map(({ text, Icon }, i) => (
        <li key={i} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#8b7ff5]/15 flex items-center justify-center shrink-0 mt-0.5">
            <Icon size={18} color="#8b7ff5" strokeWidth={1.8} />
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed pt-1.5">
            {text}
          </p>
        </li>
      ))}
    </ul>
  </div>
);

const TECH_BULLETS: BulletItem[] = [
  { Icon: Smartphone,  text: "Creating functional web and mobile applications for Android or iOS platforms." },
  { Icon: Film,        text: "Developing animated shorts or digital stories that convey a message or solution." },
  { Icon: Gamepad2,    text: "Designing interactive games that educate, solve problems, or raise awareness." },
  { Icon: Bot,         text: "Building and programming robots to perform specific tasks or solve physical problems." },
];

const PROBLEM_BULLETS: BulletItem[] = [
  { Icon: GraduationCap, text: "Innovations to improve learning, access to education, teacher training, literacy, etc." },
  { Icon: ShieldCheck,   text: "Tech solutions for community safety, personal security, cyber awareness, emergency response, etc." },
  { Icon: HeartPulse,    text: "Projects addressing public health, access to healthcare, disease prevention, wellbeing, etc." },
  { Icon: Leaf,          text: "Solutions for climate change, waste management, conservation, renewable energy, pollution control, etc." },
];

const FALLBACK_TECH_IMAGE = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2669&auto=format&fit=crop";
const FALLBACK_PROBLEM_IMAGE = "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop";

export default function FeaturesSectionDemo({ technologicalImage, problemSolvingImage }: Props) {
  const CATEGORIES = [
    {
      category: "Category 01",
      title: "Technological",
      src: technologicalImage || FALLBACK_TECH_IMAGE,
      content: <CategoryContent bullets={TECH_BULLETS} />,
    },
    {
      category: "Category 02",
      title: "Problem Solving",
      src: problemSolvingImage || FALLBACK_PROBLEM_IMAGE,
      content: <CategoryContent bullets={PROBLEM_BULLETS} />,
    },
  ];

  const cards = CATEGORIES.map((card, index) => (
    <Card key={card.src} card={card} index={index} layout />
  ));

  return (
    <div className="relative z-10 bg-background w-full pt-4 pb-20" style={{ transform: "translateZ(0)" }}>
      <div className="max-w-7xl pl-4 mx-auto">
        <h2 className="inline-block text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 border border-white/20 rounded-[2rem] px-6 py-3 sm:px-8 sm:py-4">
          Competition categories
        </h2>
      </div>
      <p className="max-w-7xl pl-4 mx-auto mt-3 text-sm md:text-base text-neutral-500 dark:text-neutral-400">
        Pick a category and build technology that drives real-world impact.
      </p>
      <Carousel items={cards} />
    </div>
  );
}
