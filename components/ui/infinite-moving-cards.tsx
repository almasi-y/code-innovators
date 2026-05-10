"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

type LogoItem = { src: string; alt: string };

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "slow",
  pauseOnHover = true,
  className,
}: {
  items: LogoItem[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  const duration = speed === "fast" ? "30s" : speed === "normal" ? "50s" : "80s";
  const animDir  = direction === "left" ? "forwards" : "reverse";
  const animValue = `scroll ${duration} ${animDir} linear infinite`;

  useEffect(() => {
    if (!scrollerRef.current) return;
    Array.from(scrollerRef.current.children).forEach((item) => {
      scrollerRef.current!.appendChild(item.cloneNode(true));
    });
    setStart(true);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-12 md:gap-20 py-4",
        )}
        style={start ? {
          animation: animValue,
          WebkitAnimation: animValue,
          ...(pauseOnHover ? {} : {}),
        } : undefined}
      >
        {items.map((item, idx) => (
          <li key={idx} className="flex shrink-0 items-center justify-center px-2">
            <img
              src={item.src}
              alt={item.alt}
              className="h-20 md:h-32 w-auto object-contain rounded-lg"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
