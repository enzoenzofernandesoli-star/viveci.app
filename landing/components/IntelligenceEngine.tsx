"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain } from "lucide-react";
import { useMemo, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";
import SectionIcon from "./ui/SectionIcon";

const axes = [
  { label: "Força", value: 78 },
  { label: "Hipertrofia", value: 65 },
  { label: "Consistência", value: 90 },
  { label: "Volume", value: 58 },
  { label: "Progressão", value: 72 },
  { label: "Equilíbrio", value: 45 },
];

const size = 280;
const center = size / 2;
const radius = 100;

function pointOnAxis(index: number, total: number, value: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (value / 100) * radius;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

function labelPoint(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = radius + 28;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

export default function IntelligenceEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();

  const points = useMemo(
    () =>
      axes
        .map((axis, i) => {
          const p = pointOnAxis(i, axes.length, inView ? axis.value : 0);
          return `${p.x},${p.y}`;
        })
        .join(" "),
    [inView]
  );

  const rings = [25, 50, 75, 100];

  return (
    <Section id="inteligencia" className="border-t border-border bg-surface/40">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center">
        <div>
          <Reveal>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-action">
                Motor de inteligência
              </p>
              <SectionIcon icon={Brain} label="Com motivo" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              &ldquo;O que eu treino hoje?&rdquo; deixa de ser uma pergunta.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg leading-relaxed text-muted">
              O VIVECI analisa dias sem estímulo, volume por grupo muscular e
              sua consistência recente pra recomendar a próxima rotina — com
              o motivo explicado, não uma sugestão às cegas. Também calcula
              seu &ldquo;DNA de treino&rdquo; e avisa na hora quando você bate
              um recorde pessoal.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 rounded-xl border border-border bg-base p-6">
              <p className="text-sm font-semibold text-ink">
                Hoje: Costas e Bíceps
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Porque: 8 dias sem estímulo em dorsais · volume 32% abaixo da
                sua média
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={ref} className="flex flex-col items-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              width="100%"
              role="img"
              aria-label={`Gráfico de radar do DNA de treino: ${axes
                .map((a) => `${a.label} ${a.value}`)
                .join(", ")}`}
              className="max-w-[320px]"
            >
              {rings.map((r) => (
                <polygon
                  key={r}
                  points={axes
                    .map((_, i) => {
                      const p = pointOnAxis(i, axes.length, r);
                      return `${p.x},${p.y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#1E2637"
                  strokeWidth={1}
                />
              ))}

              {axes.map((axis, i) => {
                const p = pointOnAxis(i, axes.length, 100);
                return (
                  <line
                    key={axis.label}
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke="#1E2637"
                    strokeWidth={1}
                  />
                );
              })}

              <motion.polygon
                points={points}
                fill="#2D6BFF"
                fillOpacity={0.15}
                stroke="#2D6BFF"
                strokeWidth={2}
                initial={false}
                animate={{ opacity: inView ? 1 : 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />

              {axes.map((axis, i) => {
                const p = labelPoint(i, axes.length);
                return (
                  <text
                    key={axis.label}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fill="#8A94A8"
                  >
                    {axis.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
