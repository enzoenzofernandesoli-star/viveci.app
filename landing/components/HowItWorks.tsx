"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ListChecks } from "lucide-react";
import { useRef } from "react";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";
import SectionIcon from "./ui/SectionIcon";

const steps = [
  {
    number: "01",
    title: "Você monta seu treino.",
    body: "Escolhe os exercícios, monta a rotina do seu jeito — sem algoritmo decidindo por você.",
  },
  {
    number: "02",
    title: "Você registra.",
    body: "Carga, série a série. O app acompanha volume, consistência e recordes automaticamente.",
  },
  {
    number: "03",
    title: "O VIVECI te devolve inteligência.",
    body: "Cruza o histórico e te diz o que treinar hoje, qual músculo você está negligenciando, quando bateu um recorde — sempre com o motivo.",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.4"],
  });
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <Section id="como-funciona" className="border-t border-border">
      <Reveal>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Como funciona
          </h2>
          <SectionIcon icon={ListChecks} label="Você decide" />
        </div>
      </Reveal>

      <div ref={ref} className="relative mt-16 pl-12 md:pl-16">
        <div className="absolute left-4 top-1 h-full w-px bg-border md:left-6">
          <motion.div
            className="w-px bg-action"
            style={{ height }}
          />
        </div>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.1}>
              <div className="relative">
                <span className="absolute -left-12 top-0 text-sm font-bold tabular-nums text-action md:-left-16">
                  {step.number}
                </span>
                <h3 className="text-xl font-semibold text-ink md:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xl leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
