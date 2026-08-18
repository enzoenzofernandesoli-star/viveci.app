"use client";

import { BodyChart, filterMuscles, ViewSide } from "body-muscles";
import { useEffect, useRef, useState } from "react";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

type GrupoId =
  | "ombros"
  | "peito"
  | "costas"
  | "biceps"
  | "triceps"
  | "abdomen"
  | "quadriceps"
  | "posteriores"
  | "panturrilhas";

interface Estatisticas {
  treinos: number;
  series: number;
  volume: string;
  diasSemEstimulo: number;
}

interface Grupo {
  id: GrupoId;
  label: string;
  stats: Estatisticas;
}

const grupos: Grupo[] = [
  { id: "ombros", label: "Ombros", stats: { treinos: 6, series: 24, volume: "3.120 kg", diasSemEstimulo: 3 } },
  { id: "peito", label: "Peito", stats: { treinos: 8, series: 32, volume: "5.480 kg", diasSemEstimulo: 2 } },
  { id: "costas", label: "Costas", stats: { treinos: 4, series: 18, volume: "3.960 kg", diasSemEstimulo: 8 } },
  { id: "biceps", label: "Bíceps", stats: { treinos: 7, series: 21, volume: "1.680 kg", diasSemEstimulo: 4 } },
  { id: "triceps", label: "Tríceps", stats: { treinos: 6, series: 20, volume: "1.750 kg", diasSemEstimulo: 5 } },
  { id: "abdomen", label: "Abdômen", stats: { treinos: 5, series: 15, volume: "—", diasSemEstimulo: 6 } },
  { id: "quadriceps", label: "Quadríceps", stats: { treinos: 5, series: 22, volume: "6.240 kg", diasSemEstimulo: 3 } },
  { id: "posteriores", label: "Posteriores", stats: { treinos: 3, series: 12, volume: "2.880 kg", diasSemEstimulo: 9 } },
  { id: "panturrilhas", label: "Panturrilhas", stats: { treinos: 4, series: 14, volume: "1.960 kg", diasSemEstimulo: 5 } },
];

const grupoPorId = new Map(grupos.map((g) => [g.id, g]));

/** Cada id anatômico da lib body-muscles mapeado pro nosso grupo de 9 posições. */
const ID_PARA_GRUPO: Record<string, GrupoId> = {
  "shoulder-front-left": "ombros",
  "shoulder-front-right": "ombros",
  "shoulder-side-left": "ombros",
  "shoulder-side-right": "ombros",
  "deltoid-rear-left": "ombros",
  "deltoid-rear-right": "ombros",
  "biceps-left": "biceps",
  "biceps-right": "biceps",
  "chest-upper-left": "peito",
  "chest-lower-left": "peito",
  "chest-upper-right": "peito",
  "chest-lower-right": "peito",
  "abs-upper-left": "abdomen",
  "abs-upper-right": "abdomen",
  "abs-lower-left": "abdomen",
  "abs-lower-right": "abdomen",
  "obliques-left": "abdomen",
  "obliques-right": "abdomen",
  "serratus-anterior-left": "abdomen",
  "serratus-anterior-right": "abdomen",
  "quads-left": "quadriceps",
  "quads-right": "quadriceps",
  "traps-upper-left": "costas",
  "traps-mid-left": "costas",
  "traps-lower-left": "costas",
  "traps-upper-right": "costas",
  "traps-mid-right": "costas",
  "traps-lower-right": "costas",
  "lats-upper-left": "costas",
  "lats-mid-left": "costas",
  "lats-lower-left": "costas",
  "lats-upper-right": "costas",
  "lats-mid-right": "costas",
  "lats-lower-right": "costas",
  "lower-back-erectors-left": "costas",
  "lower-back-erectors-right": "costas",
  "lower-back-ql-left": "costas",
  "lower-back-ql-right": "costas",
  "triceps-long-left": "triceps",
  "triceps-lateral-left": "triceps",
  "triceps-long-right": "triceps",
  "triceps-lateral-right": "triceps",
  "gluteus-medius-left": "posteriores",
  "gluteus-maximus-left": "posteriores",
  "gluteus-medius-right": "posteriores",
  "gluteus-maximus-right": "posteriores",
  "hamstrings-medial-left": "posteriores",
  "hamstrings-lateral-left": "posteriores",
  "hamstrings-medial-right": "posteriores",
  "hamstrings-lateral-right": "posteriores",
  "calves-gastroc-medial-left": "panturrilhas",
  "calves-gastroc-lateral-left": "panturrilhas",
  "calves-soleus-left": "panturrilhas",
  "calves-gastroc-medial-right": "panturrilhas",
  "calves-gastroc-lateral-right": "panturrilhas",
  "calves-soleus-right": "panturrilhas",
  "tibialis-anterior-left": "panturrilhas",
  "tibialis-anterior-right": "panturrilhas",
};

const GRUPOS_FRENTE: GrupoId[] = ["ombros", "peito", "biceps", "abdomen", "quadriceps"];
const GRUPOS_COSTAS: GrupoId[] = ["costas", "triceps", "posteriores", "panturrilhas"];

/**
 * A lib colore por gradiente próprio, o que fere a regra "zero gradiente"
 * do design system. Depois de cada render/hover repintamos cada path na
 * ordem em que `filterMuscles` os devolve (mesma ordem em que a lib os
 * insere no SVG) com `border` (neutro) ou `action`/`warn`, igual ao resto
 * da página. O clique também é anexado aqui.
 */
function repintar(
  container: HTMLElement,
  vista: ViewSide,
  selecionado: GrupoId | null,
  onClicar: (grupo: GrupoId) => void
) {
  const ordenado = filterMuscles(vista);
  const paths = container.querySelectorAll<SVGPathElement>(".body-chart-muscle");
  ordenado.forEach((musculo, i) => {
    const el = paths[i];
    if (!el) return;
    const grupoId = ID_PARA_GRUPO[musculo.id];
    const ativo = grupoId !== undefined && grupoId === selecionado;
    const overdue = grupoId ? grupoPorId.get(grupoId)!.stats.diasSemEstimulo > 7 : false;

    el.setAttribute("fill", grupoId ? (overdue ? "#F59E0B" : "#2D6BFF") : "#1E2637");
    el.style.fillOpacity = grupoId ? (ativo ? "1" : "0.55") : "1";
    el.setAttribute("stroke", ativo ? "#F2F5FA" : "#1E2637");
    el.setAttribute("stroke-width", ativo ? "0.6" : "0.15");
    el.style.filter = "none";
    el.style.cursor = grupoId ? "pointer" : "default";
    el.onclick = grupoId ? () => onClicar(grupoId) : null;
  });
}

export default function BodyMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const [vista, setVista] = useState<ViewSide>(ViewSide.FRONT);
  const [selecionado, setSelecionado] = useState<GrupoId | null>(null);

  const vistaRef = useRef(vista);
  const selecionadoRef = useRef(selecionado);
  vistaRef.current = vista;
  selecionadoRef.current = selecionado;

  function alternar(id: GrupoId) {
    setSelecionado((atual) => (atual === id ? null : id));
  }

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = new BodyChart(containerRef.current, {
      view: vistaRef.current,
      bodyState: {},
      showViewLabel: false,
      onMuscleHover: () => {
        setTimeout(() => {
          if (containerRef.current) {
            repintar(containerRef.current, vistaRef.current, selecionadoRef.current, alternar);
          }
        }, 0);
      },
    });
    repintar(containerRef.current, vistaRef.current, selecionadoRef.current, alternar);
    return () => chartRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;
    chartRef.current.update({ view: vista });
    repintar(containerRef.current, vista, selecionado, alternar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, selecionado]);

  const grupoAtivo = selecionado ? grupoPorId.get(selecionado) ?? null : null;
  const grupoIdsDaVista = vista === ViewSide.FRONT ? GRUPOS_FRENTE : GRUPOS_COSTAS;

  return (
    <Section id="mapa-corporal" className="border-t border-border bg-surface/40">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center">
        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Mapa corporal vivo
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-6 max-w-lg leading-relaxed text-muted">
              Toque em qualquer músculo e veja treinos, séries, volume e há
              quanto tempo ele não é estimulado — direto no corpo, sem
              precisar caçar números em planilha. Mais fotos de progresso com
              comparação lado a lado ao longo do tempo.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-2">
              {grupoIdsDaVista.map((id) => {
                const grupo = grupoPorId.get(id)!;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => alternar(id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      selecionado === id
                        ? "border-action text-action"
                        : "border-border text-muted hover:text-ink"
                    }`}
                  >
                    {grupo.label}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-4 min-h-[132px] rounded-xl border border-border bg-base p-6">
              {grupoAtivo ? (
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {grupoAtivo.label}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted">
                        Treinos (30d)
                      </dt>
                      <dd className="num mt-1 tabular-nums text-ink">
                        {grupoAtivo.stats.treinos}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted">
                        Séries (30d)
                      </dt>
                      <dd className="num mt-1 tabular-nums text-ink">
                        {grupoAtivo.stats.series}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted">
                        Volume (30d)
                      </dt>
                      <dd className="num mt-1 tabular-nums text-ink">
                        {grupoAtivo.stats.volume}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted">
                        Sem estímulo
                      </dt>
                      <dd
                        className={`num mt-1 tabular-nums ${
                          grupoAtivo.stats.diasSemEstimulo > 7
                            ? "text-warn"
                            : "text-ink"
                        }`}
                      >
                        {grupoAtivo.stats.diasSemEstimulo} dias
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Toque em um músculo para ver os dados.
                </p>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="flex flex-col items-center">
            <div className="mb-4 flex border-b border-border">
              <button
                type="button"
                onClick={() => setVista(ViewSide.FRONT)}
                className={`relative px-6 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors ${
                  vista === ViewSide.FRONT
                    ? "text-action after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-action"
                    : "text-muted"
                }`}
              >
                Frente
              </button>
              <button
                type="button"
                onClick={() => setVista(ViewSide.BACK)}
                className={`relative px-6 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors ${
                  vista === ViewSide.BACK
                    ? "text-action after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-action"
                    : "text-muted"
                }`}
              >
                Costas
              </button>
            </div>

            <div
              ref={containerRef}
              role="img"
              aria-label="Silhueta humana com grupos musculares clicáveis"
              className="w-full max-w-[260px] [&_svg]:mx-auto [&_svg]:!max-h-[420px]"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
