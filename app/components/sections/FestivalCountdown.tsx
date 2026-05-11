"use client";

import { useEffect, useState } from "react";
import { useTimer } from "react-timer-hook";

// Festival date: June 13, 2026 at 08:00 EAT (UTC+3) = 05:00 UTC
// Using Date.UTC to avoid iOS Safari rejecting the +03:00 offset in ISO strings
const FESTIVAL_DATE = new Date(Date.UTC(2026, 5, 13, 5, 0, 0));

interface TimeUnitProps {
  value: number;
  label: string;
}

function TimeUnit({ value, label }: TimeUnitProps) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-3">
      {/* Digit card */}
      <div
        className="relative flex items-center justify-center w-16 h-16 xs:w-20 xs:h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Top reflection */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)",
          }}
        />
        {/* Divider line (flip-clock feel) */}
        <div
          className="absolute inset-x-0 top-1/2 h-px"
          style={{ background: "rgba(0,0,0,0.4)" }}
        />
        <span
          className="relative z-10 font-mono font-bold text-2xl xs:text-3xl sm:text-5xl md:text-6xl tracking-tighter text-white"
        >
          {display}
        </span>
      </div>
      {/* Label */}
      <span className="text-[10px] xs:text-xs sm:text-sm uppercase tracking-widest text-white/50 font-medium">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="hidden sm:flex flex-col items-center gap-4 pb-8 sm:pb-10 md:pb-12 self-center">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "var(--color-accent)", opacity: 0.6 }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "var(--color-accent)", opacity: 0.6 }}
      />
    </div>
  );
}

export default function FestivalCountdown() {
  const [mounted, setMounted] = useState(false);
  const { days, hours, minutes, seconds, isRunning } = useTimer({
    expiryTimestamp: FESTIVAL_DATE,
    onExpire: () => {
      // Countdown has reached the festival date
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasExpired = mounted && !isRunning && days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  return (
    <section
      className="relative z-10 w-full py-20 md:py-28 overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      {/* Subtle glow behind the digits */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,230,180,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-16">
        {/* Section label */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-16 gap-3">
          <span className="text-xs sm:text-sm uppercase tracking-widest text-white/40">
            Mark your calendar
          </span>
          <h2
            className="font-display text-[clamp(1.8rem,4vw,3.5rem)] font-semibold leading-tight text-white"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}
          >
            {hasExpired ? "The Festival Has Begun!" : "Countdown to Festival Day"}
          </h2>
        </div>

        {/* Digit row – only rendered client-side to avoid hydration mismatch */}
        {mounted && !hasExpired && (
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
            <TimeUnit value={days} label="Days" />
            <Separator />
            <TimeUnit value={hours} label="Hours" />
            <Separator />
            <TimeUnit value={minutes} label="Minutes" />
            <Separator />
            <TimeUnit value={seconds} label="Seconds" />
          </div>
        )}
        {!mounted && (
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
            {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
              <TimeUnit key={label} value={0} label={label} />
            ))}
          </div>
        )}

        {/* CTA nudge */}
        <div className="flex justify-center mt-12 md:mt-16">
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all duration-200"
            style={{ background: "#6d28d9" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#7c3aed")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#6d28d9")
            }
          >
            Register Your School
          </a>
        </div>
      </div>
    </section>
  );
}
