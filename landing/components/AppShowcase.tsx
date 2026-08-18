"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import Button from "./ui/Button";
import PhoneMockup from "./PhoneMockup";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_TICKS = 24;

export default function AppShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
      prefersReducedMotion ||
      !wrapRef.current ||
      !pinRef.current ||
      !ringRef.current
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            scrub: 1,
            pin: pinRef.current,
            trigger: pinRef.current,
            start: "top top",
            endTrigger: wrapRef.current,
            end: "bottom top",
          },
        })
        .to(ringRef.current, { rotateZ: 900, ease: "none" });
    });

    return () => ctx.revert();
  }, []);

  return (
    <Section id="app" className="border-t border-border">
      <div ref={wrapRef} className="relative">
        <div
          ref={pinRef}
          className="flex min-h-[80vh] flex-col items-center justify-center gap-12"
        >
          <div className="relative flex items-center justify-center py-10">
            <svg
              ref={ringRef}
              viewBox="0 0 400 400"
              className="pointer-events-none absolute h-[340px] w-[340px] md:h-[420px] md:w-[420px]"
              aria-hidden="true"
            >
              <circle
                cx="200"
                cy="200"
                r="180"
                fill="none"
                stroke="#1E2637"
                strokeWidth={1}
              />
              {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
                const angle = (i / TOTAL_TICKS) * Math.PI * 2;
                const r1 = 172;
                const r2 = 188;
                const x1 = (200 + r1 * Math.cos(angle)).toFixed(2);
                const y1 = (200 + r1 * Math.sin(angle)).toFixed(2);
                const x2 = (200 + r2 * Math.cos(angle)).toFixed(2);
                const y2 = (200 + r2 * Math.sin(angle)).toFixed(2);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#2D6BFF"
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.5}
                  />
                );
              })}
            </svg>

            <PhoneMockup />
          </div>

          <Reveal className="flex flex-col items-center gap-4 px-6 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              O app que vai com você pro treino.
            </h2>
            <p className="max-w-md leading-relaxed text-muted">
              Rotina, carga e recomendação — tudo no bolso, sem planilha.
            </p>
            <Button href="#cta" variant="primary">
              Começar agora
            </Button>
          </Reveal>
        </div>

        <div aria-hidden="true" className="h-[40vh]" />
      </div>
    </Section>
  );
}
