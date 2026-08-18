"use client";

import { Heart, MessageCircle, Users } from "lucide-react";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";
import SectionIcon from "./ui/SectionIcon";

interface Post {
  autor: string;
  rotina: string;
  duracao: string;
  volume: string;
  pr?: string;
  curtidas: number;
  comentarios: number;
}

const posts: Post[] = [
  {
    autor: "Marina O.",
    rotina: "Pernas — foco em posterior",
    duracao: "58 min",
    volume: "9.240 kg",
    pr: "Novo PR: agachamento 92,5 kg",
    curtidas: 24,
    comentarios: 6,
  },
  {
    autor: "Lucas T.",
    rotina: "Push — peito, ombro, tríceps",
    duracao: "51 min",
    volume: "6.180 kg",
    curtidas: 15,
    comentarios: 2,
  },
];

export default function Social() {
  return (
    <Section id="social" className="border-t border-border bg-surface/40">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center">
        <div>
          <Reveal>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                Social com propósito
              </h2>
              <SectionIcon icon={Users} label="Sem ranking" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-6 max-w-lg leading-relaxed text-muted">
              Uma rede social construída em cima de treino de verdade — não
              posts genéricos. Publique seu treino real (com controle total
              do que aparece), curta, comente, siga quem te inspira. Sem
              métricas vaidosas, sem ranking de aparência.
            </p>
          </Reveal>
        </div>

        <div className="space-y-4">
          {posts.map((post, index) => (
            <Reveal key={post.autor} delay={0.05 + index * 0.08}>
              <article className="rounded-xl border border-border bg-base p-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-semibold text-ink"
                    aria-hidden="true"
                  >
                    {post.autor
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <p className="text-sm font-medium text-ink">{post.autor}</p>
                </div>

                <p className="mt-4 text-sm font-medium text-ink">
                  {post.rotina}
                </p>

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                  <div className="flex gap-1">
                    <dt>Duração:</dt>
                    <dd className="num tabular-nums">{post.duracao}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Volume:</dt>
                    <dd className="num tabular-nums">{post.volume}</dd>
                  </div>
                </dl>

                {post.pr && (
                  <p className="mt-3 text-xs font-medium text-success">
                    {post.pr}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-5 border-t border-border pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <Heart className="h-4 w-4" strokeWidth={1.75} />
                    {post.curtidas}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                    {post.comentarios}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
