"use client";

import { useMemo, useState } from "react";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

type ExercicioTipo = "composto" | "isolado";

interface ExercicioExpress {
  nome: string;
  tipo: ExercicioTipo;
  minutoMinimo: number;
}

const exercicios: ExercicioExpress[] = [
  { nome: "Supino reto", tipo: "composto", minutoMinimo: 20 },
  { nome: "Puxada frontal", tipo: "composto", minutoMinimo: 20 },
  { nome: "Agachamento", tipo: "composto", minutoMinimo: 20 },
  { nome: "Remada curvada", tipo: "composto", minutoMinimo: 30 },
  { nome: "Desenvolvimento", tipo: "composto", minutoMinimo: 30 },
  { nome: "Elevação lateral", tipo: "isolado", minutoMinimo: 40 },
  { nome: "Rosca direta", tipo: "isolado", minutoMinimo: 40 },
  { nome: "Tríceps corda", tipo: "isolado", minutoMinimo: 50 },
  { nome: "Cadeira extensora", tipo: "isolado", minutoMinimo: 60 },
  { nome: "Mesa flexora", tipo: "isolado", minutoMinimo: 60 },
  { nome: "Panturrilha em pé", tipo: "isolado", minutoMinimo: 70 },
  { nome: "Abdominal supra", tipo: "isolado", minutoMinimo: 80 },
];

export default function YourControl() {
  const [minutos, setMinutos] = useState(45);

  const listaAtual = useMemo(
    () => exercicios.filter((ex) => ex.minutoMinimo <= minutos),
    [minutos]
  );

  return (
    <Section id="controle" className="border-t border-border">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-start">
        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Treino sob seu controle
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-6 max-w-lg leading-relaxed text-muted">
              Rotinas 100% montadas por você, com 59 exercícios com
              demonstração em vídeo real. Sessão com cronômetro, sugestão de
              carga baseada no seu último treino, e um modo Express que
              reconstrói qualquer rotina pra caber no tempo que você tem hoje.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="tempo-express"
                className="text-sm font-medium uppercase tracking-[0.1em] text-muted"
              >
                Modo Express
              </label>
              <span className="num text-2xl font-bold tabular-nums text-action">
                {minutos} min
              </span>
            </div>

            <input
              id="tempo-express"
              type="range"
              min={20}
              max={90}
              step={5}
              value={minutos}
              onChange={(event) => setMinutos(Number(event.target.value))}
              className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-action"
              aria-valuemin={20}
              aria-valuemax={90}
              aria-valuenow={minutos}
              aria-label="Duração do treino em minutos"
            />

            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>20 min</span>
              <span>90 min</span>
            </div>

            <ul className="mt-8 space-y-2" aria-live="polite">
              {listaAtual.map((ex) => (
                <li
                  key={ex.nome}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <span className="text-ink">{ex.nome}</span>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {ex.tipo === "composto" ? "Composto" : "Isolado"}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs text-muted">
              {listaAtual.length} de {exercicios.length} exercícios cabem em{" "}
              {minutos} minutos.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
