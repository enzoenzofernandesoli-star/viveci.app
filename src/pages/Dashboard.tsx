import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { MapaCorporal } from '../components/MapaCorporal'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useMapaMuscular } from '../lib/mapa'
import { useRotinas } from '../lib/rotinas'
import { useDia, somar } from '../lib/diario'
import { hojeISO } from '../lib/data'
import { calcularMetas } from '../lib/metas'
import type { Perfil } from '../lib/perfil'

function formatoBR(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

function CardTreino({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { rotinas, carregando, erro } = useRotinas(userId)

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-[17px] font-semibold">Treino</h2>
      {carregando ? (
        <p className="mt-3 text-sm text-ink-2">Carregando suas rotinas...</p>
      ) : erro ? (
        <p className="mt-3 text-sm text-ink-2">Não deu pra carregar suas rotinas agora.</p>
      ) : rotinas.length === 0 ? (
        <p className="mt-1 text-sm text-ink-2">Você ainda não criou nenhuma rotina.</p>
      ) : (
        <p className="mt-1 text-sm text-ink-2">
          {rotinas.length} {rotinas.length === 1 ? 'rotina criada' : 'rotinas criadas'}
        </p>
      )}
      <button
        onClick={() => navigate('/treino')}
        className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        {rotinas.length === 0 && !carregando ? 'Criar rotina' : 'Ver treinos'}
      </button>
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
  const metas = calcularMetas(perfilCalculo)
  const pct = metas.meta_kcal > 0 ? Math.min((consumido.kcal / metas.meta_kcal) * 100, 100) : 0
  const cor = pct < 100 ? 'var(--color-brand)' : pct <= 110 ? 'var(--color-up)' : 'var(--color-gold)'

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-[17px] font-semibold">Nutrição hoje</h2>
      <p className="mt-1 text-sm text-ink">
        <span className="num">{formatoBR(consumido.kcal)}</span>{' '}
        <span className="text-ink-2">de {formatoBR(metas.meta_kcal)} kcal</span>
      </p>
      <div className="mt-3 h-2 rounded-full bg-card-hover">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
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

export default function Dashboard() {
  const { sessao } = useSessao()
  const { perfil, carregando: carregandoPerfil } = usePerfil(sessao?.user.id)
  const { percentuais, desequilibrios, carregando: carregandoMapa, erro: erroMapa } = useMapaMuscular(sessao?.user.id)

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
      <div className="mt-6 space-y-5">
        <CardTreino userId={sessao.user.id} />
        <CardNutricao userId={sessao.user.id} perfil={perfil} />

        {carregandoMapa ? (
          <Empty text="Carregando mapa corporal..." />
        ) : erroMapa || !percentuais ? (
          <Empty text="Não deu pra carregar seu mapa corporal. Tenta de novo em instantes." />
        ) : (
          <MapaCorporal percentuais={percentuais} desequilibrios={desequilibrios} />
        )}
      </div>
    </Page>
  )
}
