import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { MapaCorporal } from '../components/MapaCorporal'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useRotinas } from '../lib/rotinas'
import { useDia, somar } from '../lib/diario'
import { hojeISO } from '../lib/data'
import { useMetaAtiva } from '../lib/metaManual'
import { useVivici } from '../lib/vivici'
import type { Perfil } from '../lib/perfil'

function formatoBR(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

function CardRecomendacao({
  recomendacao,
  carregando,
}: {
  recomendacao: ReturnType<typeof useVivici>['resultado']
  carregando: boolean
}) {
  const navigate = useNavigate()

  if (carregando) {
    return (
      <div className="animar-entrada rounded-2xl border border-line bg-card p-6">
        <p className="text-sm text-ink-2">Analisando seu histórico...</p>
      </div>
    )
  }

  if (!recomendacao?.recomendacao) return null

  const { nome, motivos, rotinaId } = recomendacao.recomendacao

  return (
    <div className="animar-entrada rounded-2xl border border-line bg-card p-6">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">O que eu treino hoje?</span>
      <h2 className="mt-1 text-[17px] font-semibold">{nome}</h2>
      <ul className="mt-2 space-y-1">
        {motivos.map((m) => (
          <li key={m} className="text-sm text-ink-2">
            {m}
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate(`/treino/${rotinaId}/sessao`)}
        className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        Começar treino
      </button>
    </div>
  )
}

function CardDailyScore({ resultado }: { resultado: NonNullable<ReturnType<typeof useVivici>['resultado']> }) {
  const { dailyScore } = resultado
  return (
    <div className="animar-entrada rounded-2xl border border-line bg-card p-6" style={{ animationDelay: '60ms' }}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">Seu dia</span>
      <p className="num animar-escala mt-1 text-[44px] font-bold text-brand" style={{ animationDelay: '160ms' }}>
        {dailyScore.score}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-ink-2">Treino</span>
          <p className="num font-semibold">{dailyScore.treino}%</p>
        </div>
        <div>
          <span className="text-ink-2">Alimentação</span>
          <p className="num font-semibold">{dailyScore.alimentacao}%</p>
        </div>
        <div>
          <span className="text-ink-2">Consistência</span>
          <p className="num font-semibold">{dailyScore.consistencia}%</p>
        </div>
        <div>
          <span className="text-ink-2">Evolução</span>
          <p className="num font-semibold">{dailyScore.evolucao}%</p>
        </div>
      </div>
    </div>
  )
}

function CardAlertas({ resultado }: { resultado: NonNullable<ReturnType<typeof useVivici>['resultado']> }) {
  const { musculoNegligenciado, eventosPR } = resultado
  if (!musculoNegligenciado && eventosPR.length === 0) return null

  return (
    <div className="space-y-3">
      {eventosPR.length > 0 && (
        <div className="animar-escala rounded-2xl border border-gold/30 bg-card p-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gold">Novo PR!</span>
          {eventosPR.map((e) => {
            const exercicio = e.atual
            return (
              <p key={`${e.exercicioId}-${exercicio.data}`} className="mt-1 text-sm text-ink">
                <span className="num font-semibold">{exercicio.peso_kg}kg</span> × {exercicio.reps} —{' '}
                <span className="text-up">+{e.variacaoPercentual}%</span>
              </p>
            )
          })}
        </div>
      )}
      {musculoNegligenciado && (
        <div className="animar-entrada rounded-2xl border border-line bg-card p-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">
            Músculo negligenciado
          </span>
          <p className="mt-1 text-sm text-ink">
            <span className="font-semibold">{musculoNegligenciado.grupo}</span> está com{' '}
            {musculoNegligenciado.percentual}% do volume de {musculoNegligenciado.grupoReferencia} (
            {musculoNegligenciado.percentualReferencia}%).
          </p>
        </div>
      )}
    </div>
  )
}

function CardNutricao({ userId, perfil }: { userId: string; perfil: NonNullable<ReturnType<typeof usePerfil>['perfil']> }) {
  const navigate = useNavigate()
  const { itens } = useDia(userId, hojeISO())
  const consumido = somar(itens)

  const perfilCalculo: Perfil = {
    nome: perfil.nome!,
    sexo: perfil.sexo!,
    idade: perfil.idade!,
    altura_cm: perfil.altura_cm!,
    peso_kg: perfil.peso_kg!,
    dias_semana: perfil.dias_semana!,
    objetivo: perfil.objetivo!,
  }
  const { metas } = useMetaAtiva(userId, perfilCalculo)
  const metaKcal = metas?.meta_kcal ?? 0
  const pct = metaKcal > 0 ? Math.min((consumido.kcal / metaKcal) * 100, 100) : 0
  const cor = pct < 100 ? 'var(--color-brand)' : pct <= 110 ? 'var(--color-up)' : 'var(--color-gold)'

  const [barPct, setBarPct] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setBarPct(pct), 50)
    return () => clearTimeout(id)
  }, [pct])

  return (
    <div className="animar-entrada rounded-2xl border border-line bg-card p-6" style={{ animationDelay: '120ms' }}>
      <h2 className="text-[17px] font-semibold">Nutrição hoje</h2>
      <p className="mt-1 text-sm text-ink">
        <span className="num">{formatoBR(consumido.kcal)}</span>{' '}
        <span className="text-ink-2">de {formatoBR(metaKcal)} kcal</span>
      </p>
      <div className="mt-3 h-2 rounded-full bg-card-hover">
        <div
          className="h-2 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${barPct}%`, backgroundColor: cor }}
        />
      </div>
      <button
        onClick={() => navigate('/nutricao')}
        className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
      >
        Ver diário
      </button>
    </div>
  )
}

function ConteudoDashboard({
  userId,
  perfil,
}: {
  userId: string
  perfil: NonNullable<ReturnType<typeof usePerfil>['perfil']>
}) {
  const navigate = useNavigate()
  const { rotinas, carregando: carregandoRotinas } = useRotinas(userId)
  const { itens } = useDia(userId, hojeISO())
  const consumido = somar(itens)

  const perfilCalculo: Perfil = {
    nome: perfil.nome!,
    sexo: perfil.sexo!,
    idade: perfil.idade!,
    altura_cm: perfil.altura_cm!,
    peso_kg: perfil.peso_kg!,
    dias_semana: perfil.dias_semana!,
    objetivo: perfil.objetivo!,
  }
  const { metas } = useMetaAtiva(userId, perfilCalculo)
  const metaKcal = metas?.meta_kcal ?? 0

  const { resultado, carregando: carregandoVivici } = useVivici(userId, rotinas, perfil.dias_semana, consumido.kcal, metaKcal)

  return (
    <div className="mt-6 space-y-5">
      {carregandoRotinas ? (
        <Empty text="Carregando suas rotinas..." />
      ) : rotinas.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-[17px] font-semibold">Treino</h2>
          <p className="mt-1 text-sm text-ink-2">Você ainda não criou nenhuma rotina.</p>
          <button
            onClick={() => navigate('/treino')}
            className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Criar rotina
          </button>
        </div>
      ) : (
        <CardRecomendacao recomendacao={resultado} carregando={carregandoVivici} />
      )}

      {resultado && !carregandoVivici && <CardDailyScore resultado={resultado} />}
      <CardNutricao userId={userId} perfil={perfil} />
      {resultado && !carregandoVivici && <CardAlertas resultado={resultado} />}

      {carregandoVivici || !resultado ? (
        <Empty text="Carregando mapa corporal..." />
      ) : (
        <MapaCorporal
          percentuais={resultado.percentuaisSemana}
          desequilibrios={resultado.desequilibrios}
          estatisticasPorGrupo={resultado.estatisticasPorGrupo}
        />
      )}
    </div>
  )
}

export default function Dashboard() {
  const { sessao } = useSessao()
  const { perfil, carregando: carregandoPerfil } = usePerfil(sessao?.user.id)

  if (carregandoPerfil) {
    return (
      <Page title="Dashboard">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  if (!perfil || !sessao) {
    return (
      <Page title="Dashboard">
        <Empty text="Não deu pra carregar seu perfil. Tenta de novo em instantes." />
      </Page>
    )
  }

  return (
    <Page title={`Olá, ${perfil.nome}`}>
      <ConteudoDashboard userId={sessao.user.id} perfil={perfil} />
    </Page>
  )
}
