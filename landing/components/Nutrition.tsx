"use client";

import { motion, useInView } from "framer-motion";
import { Utensils } from "lucide-react";
import { useRef } from "react";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";
import SectionIcon from "./ui/SectionIcon";

interface Macro {
  label: string;
  value: number;
  grams: string;
  color: string;
}

const macros: Macro[] = [
  { label: "Proteína", value: 0.82, grams: "145 g", color: "#2D6BFF" },
  { label: "Carboidrato", value: 0.64, grams: "500 g", color: "#8B5CF6" },
  { label: "Gordura", value: 0.71, grams: "95 g", color: "#F5A524" },
];

const radius = 34;
const circumference = 2 * Math.PI * radius;

export default function Nutrition() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section id="nutricao" className="border-t border-border">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center">
        <div>
          <Reveal>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                Nutrição sem fricção
              </h2>
              <SectionIcon icon={Utensils} label="Sem fricção" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-6 max-w-lg leading-relaxed text-muted">
              Diário alimentar com cálculo automático de calorias e macros,
              meta calculada pro seu objetivo (e editável na hora que você
              quiser). Escaneie o prato ou o rótulo pra registrar mais rápido.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 rounded-xl border border-border bg-surface p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">
                  Calorias hoje
                </span>
                <span className="num text-sm tabular-nums text-ink">
                  2.740 / 3.430 kcal
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-border">
                <motion.div
                  className="h-2 rounded-full bg-action"
                  initial={{ width: "0%" }}
                  animate={{ width: inView ? "80%" : "0%" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </Reveal>
        </div>

        <div ref={ref} className="flex justify-center gap-6 md:gap-8">
          {macros.map((macro, index) => (
            <Reveal key={macro.label} delay={0.05 + index * 0.08}>
              <div className="flex flex-col items-center gap-3">
                <svg
                  viewBox="0 0 80 80"
                  width="88"
                  height="88"
                  role="img"
                  aria-label={`${macro.label}: ${macro.grams}`}
                >
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke="#1E2637"
                    strokeWidth="7"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke={macro.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{
                      strokeDashoffset: inView
                        ? circumference * (1 - macro.value)
                        : circumference,
                    }}
                    transition={{
                      duration: 0.9,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.1 + index * 0.08,
                    }}
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-xs font-medium text-ink">
                    {macro.label}
                  </p>
                  <p className="num text-xs tabular-nums text-muted">
                    {macro.grams}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
