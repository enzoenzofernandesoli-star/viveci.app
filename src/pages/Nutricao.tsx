import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { calcularMetas } from '../lib/metas'
import type { Perfil } from '../lib/perfil'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useDia, somar } from '../lib/diario'
import { hojeISO } from '../lib/data'

function formatoBR(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

const RAIO = 80
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

function AnelCalorias({ consumido, meta }: { consumido: number; meta: number }) {
  const pct = meta > 0 ? (consumido / meta) * 100 : 0
  const progresso = Math.min(pct, 100)
  const excedente = pct > 110 ? Math.min(pct - 100, 100) : 0

  const cor = pct < 100 ? 'var(--color-brand)' : pct <= 110 ? 'var(--color-up)' : 'var(--color-gold)'
  const comprimento = (progresso / 100) * CIRCUNFERENCIA
  const comprimentoExcedente = (excedente / 100) * CIRCUNFERENCIA

  return (
    <div className="relative mx-auto h-[200px] w-[200px]">
      <svg viewBox="0 0 200 200" className="-rotate-90">
        <circle cx="100" cy="100" r={RAIO} fill="none" stroke="var(--color-card-hover)" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={RAIO}
          fill="none"
          stroke={cor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${comprimento} ${CIRCUNFERENCIA - comprimento}`}
        />
        {excedente > 0 && (
          <circle
            cx="100"
            cy="100"
            r={RAIO + 10}
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={0.6}
            strokeDasharray={`${comprimentoExcedente} ${CIRCUNFERENCIA - comprimentoExcedente}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-[44px] font-bold leading-none">{formatoBR(consumido)}</span>
        <span className="mt-2 text-sm text-ink-2">de {formatoBR(meta)} kcal</span>
      </div>
    </div>
  )
}

function BarraMacro({
  label,
  consumido,
  meta,
  cor,
}: {
  label: string
  consumido: number
  meta: number
  cor: string
}) {
  const pct = meta > 0 ? Math.min((consumido / meta) * 100, 100) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="num text-ink">
          {formatoBR(consumido)} <span className="text-ink-2">/ {formatoBR(meta)} g</span>
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-card-hover">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: cor }}
        />
      </div>
    </div>
  )
}

export default function Nutricao() {
  const { sessao } = useSessao()
  const { perfil, carregando, erro } = usePerfil(sessao?.user.id)
  const itensHoje = useDia(hojeISO())
  const consumido = somar(itensHoje)

  if (carregando) {
    return (
      <Page title="Nutrição">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  if (erro || !perfil) {
    return (
      <Page title="Nutrição">
        <Empty text="Não deu pra carregar seu perfil. Tenta de novo em instantes." />
      </Page>
    )
  }

  const perfilCalculo: Perfil = {
    nome: perfil.nome!,
    sexo: perfil.sexo!,
    idade: perfil.idade!,
    altura_cm: perfil.altura_cm!,
    peso_kg: perfil.peso_kg!,
    dias_semana: perfil.dias_semana!,
    objetivo: perfil.objetivo!,
  }
  const metas = calcularMetas(perfilCalculo)

  return (
    <Page title="Nutrição">
      <div className="mt-6 rounded-2xl border border-line bg-card p-6">
        <AnelCalorias consumido={consumido.kcal} meta={metas.meta_kcal} />

        <div className="mt-8 space-y-5">
          <BarraMacro label="Proteína" consumido={consumido.prot_g} meta={metas.meta_prot_g} cor="#2F6BFF" />
          <BarraMacro label="Carboidrato" consumido={consumido.carb_g} meta={metas.meta_carb_g} cor="#8B5CF6" />
          <BarraMacro label="Gordura" consumido={consumido.gord_g} meta={metas.meta_gord_g} cor="#F5A524" />
        </div>
      </div>
    </Page>
  )
}
