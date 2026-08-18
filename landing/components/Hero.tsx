"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Trophy, Utensils } from "lucide-react";
import Button from "./ui/Button";
import PhoneMockup from "./PhoneMockup";
import Reveal from "./ui/Reveal";

const palavras = ["Treine.", "Evolua.", "Conquiste."];

const stats = [
  { value: "59", label: "exercícios com vídeo real" },
  { value: "0", label: "planos genéricos de 12 semanas" },
  { value: "100%", label: "rotina montada por você" },
];

const recursos = [
  "Rotinas manuais",
  "Mapa corporal",
  "Nutrição sem fricção",
  "Social real",
  "Cardio",
  "Consistência",
  "Recordes pessoais",
  "DNA de treino",
  "Treino Express",
  "Daily Score",
];

export default function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
      <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-6 md:grid-cols-2 md:px-10">
        <Reveal>
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-action">
            Vim. Vi. Venci.
          </p>

          <h1 className="font-display text-3xl tracking-tight text-ink md:text-5xl">
            {palavras.map((palavra, index) => (
              <motion.span
                key={palavra}
                className="mr-3 inline-block last:mr-0"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 16,
                  delay: 0.15 + index * 0.12,
                }}
                suppressHydrationWarning
              >
                {palavra}
              </motion.span>
            ))}
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted md:text-lg">
            Um app de treino que não te dá um plano genérico — ele aprende com
            o seu histórico real e te diz exatamente o que fazer hoje, e por
            quê.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="#cta" variant="primary">
              Começar agora
            </Button>
            <Button href="#cta" variant="ghost">
              Entrar na lista de espera
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-border pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="num font-display text-2xl font-bold text-ink md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 max-w-[10rem] text-xs leading-snug text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal
          delay={0.15}
          className="relative flex justify-center md:justify-end"
        >
          <div className="relative pl-8 pt-6 md:pl-14">
            {/* segundo telefone, atrás, só pra dar profundidade */}
            <div
              aria-hidden="true"
              className="absolute -left-2 top-2 hidden w-[260px] -rotate-[10deg] rounded-[36px] border border-border bg-surface/60 md:block"
              style={{ height: 460 }}
            />

            <motion.div
              className="absolute left-0 top-16 z-20 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 md:-left-10"
              aria-hidden="true"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success/10">
                <Trophy className="h-4 w-4 text-success" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Novo recorde</p>
                <p className="text-[10px] text-muted">Supino · 82,5 kg</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute right-0 bottom-20 z-20 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 md:-right-8"
              aria-hidden="true"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5 }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-action/40 bg-action/10">
                <Utensils className="h-4 w-4 text-action" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Meta batida</p>
                <p className="text-[10px] text-muted">Proteína · 145 g</p>
              </div>
            </motion.div>

            <div className="relative z-10 rotate-[3deg]">
              <PhoneMockup />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-16 border-t border-border py-6">
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div
            className="animate-marquee flex w-max gap-10 whitespace-nowrap"
            aria-hidden="true"
          >
            {[...recursos, ...recursos].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-10 text-sm text-muted"
              >
                {item}
                <span className="text-border">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        className="mt-10 hidden flex-col items-center gap-2 md:flex"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
          Role pra explorar
        </span>
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 text-muted" strokeWidth={1.75} />
        </motion.div>
      </motion.div>
    </section>
  );
}
