"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";

export default function PhoneMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative w-[280px] rounded-[36px] border border-border bg-surface p-3 shadow-[0_0_0_1px_rgba(30,38,55,0.4)] md:w-[300px]"
      aria-hidden="true"
      animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="rounded-[26px] border border-border bg-base p-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">
              Hoje
            </p>
            <p className="text-sm font-semibold text-ink">Costas e Bíceps</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
            <Flame className="h-4 w-4 text-warn" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted">
            Daily Score
          </p>
          <p className="num mt-1 text-3xl font-bold tabular-nums text-ink">
            84
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-border">
            <div className="h-1.5 w-[84%] rounded-full bg-action" />
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: "Puxada frontal", detail: "4×10 · 60 kg" },
            { label: "Remada curvada", detail: "4×10 · 55 kg" },
            { label: "Rosca direta", detail: "3×12 · 22 kg" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
            >
              <span className="text-xs text-ink">{item.label}</span>
              <span className="text-[11px] text-muted">{item.detail}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-action/40 bg-action/10 px-4 py-3">
          <span className="text-xs font-medium text-action">
            +2,5% sugerido
          </span>
          <TrendingUp className="h-4 w-4 text-action" strokeWidth={1.75} />
        </div>
      </div>
    </motion.div>
  );
}
