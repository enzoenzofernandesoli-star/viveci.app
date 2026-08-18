import { ArrowRight, Clock3, Dumbbell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { RecomendacaoTreino } from '../../lib/recomendacaoTreino'
import type { Rotina } from '../../lib/rotinas'
import { reconstruirTreinoExpress } from '../../lib/treinoExpress'
import { Button } from '../ui/Button'
import { Eyebrow } from '../ui/Typography'
import { WorkoutCover } from '../ui/WorkoutCover'

const FOTOS_HERO = import.meta.glob('../../assets/viveci/home-hero.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const FOTO_HERO = Object.values(FOTOS_HERO)[0] ?? null

function nomeTipografico(nome: string): string {
  const limpo = nome.trim()
  if (limpo === '' || limpo !== limpo.toLocaleLowerCase('pt-BR')) return limpo
  return limpo.replace(/(^|[\s/-])([\p{L}\p{N}])/gu, (_, separador: string, letra: string) =>
    `${separador}${letra.toLocaleUpperCase('pt-BR')}`,
  )
}

function duracaoEstimada(rotina: Rotina | undefined): number | null {
  if (!rotina || rotina.itens.length === 0) return null
  return reconstruirTreinoExpress(
    rotina.itens.map((item) => ({
      id: item.id,
      exercicioId: item.exercicio_id,
      nome: item.exercicio.nome,
      isComposto: item.exercicio.is_composto,
      series: item.series,
      descansoSeg: item.descanso_seg,
      ordem: item.ordem,
    })),
    24 * 60,
  ).tempoOriginalMin
}

function FundoEditorial() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -right-10 top-5 h-56 w-56 rotate-12 border border-brand/20" />
      <div className="absolute -right-20 top-16 h-56 w-56 rotate-12 border border-line" />
      <div className="absolute bottom-0 left-0 h-px w-2/3 bg-brand/60" />
      <span className="absolute -bottom-8 -right-3 text-[116px] font-extrabold tracking-[-0.08em] text-ink/[0.035]">V</span>
    </div>
  )
}

export function HeroTreino({
  recomendacao,
  rotina,
  carregando,
  semRotinas,
}: {
  recomendacao: RecomendacaoTreino | null
  rotina?: Rotina
  carregando: boolean
  semRotinas: boolean
}) {
  const navigate = useNavigate()
  const grupos = rotina ? [...new Set(rotina.itens.map((item) => item.exercicio.grupo_muscular))] : []
  const duracao = duracaoEstimada(rotina)
  const nomeExibido = recomendacao ? nomeTipografico(recomendacao.nome) : ''

  if (carregando) {
    return <div className="h-[430px] animate-pulse rounded-[var(--radius-media)] bg-card" aria-label="Analisando seu histórico" />
  }

  if (!recomendacao) {
    return (
      <WorkoutCover
        src={FOTO_HERO}
        alt=""
        fallback={<FundoEditorial />}
        className="border-y border-line/60 lg:rounded-[var(--radius-media)] lg:border"
      >
        <Eyebrow className="text-silver">Hoje</Eyebrow>
        <h1 className="mt-3 max-w-[12ch] text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-[42px]">
          Sem rotina recomendada
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2">
          {semRotinas
            ? 'Crie sua primeira rotina para o VIVECI começar a usar seu histórico.'
            : 'Ainda não há dados suficientes para indicar uma rotina agora.'}
        </p>
        <Button onClick={() => navigate('/treino')} className="mt-7 w-full sm:w-auto">
          Ver minhas rotinas <ArrowRight size={17} />
        </Button>
      </WorkoutCover>
    )
  }

  return (
    <WorkoutCover
      src={FOTO_HERO}
      alt=""
      fallback={<FundoEditorial />}
      className="border-y border-line/60 lg:rounded-[var(--radius-media)] lg:border"
    >
      <Eyebrow className="text-silver">Hoje</Eyebrow>
      <h1 className="mt-3 max-w-[13ch] text-[40px] font-semibold leading-[0.98] tracking-[-0.06em] text-ink sm:text-[50px] lg:text-[48px] xl:text-[56px]">
        {nomeExibido}
      </h1>
      {grupos.length > 0 && (
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-silver">
          {grupos.join(' · ')}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-silver/80">
        {rotina && (
          <span className="inline-flex items-center gap-2">
            <Dumbbell size={15} strokeWidth={1.7} /> {rotina.itens.length} exercícios
          </span>
        )}
        {duracao !== null && (
          <span className="inline-flex items-center gap-2">
            <Clock3 size={15} strokeWidth={1.7} /> aproximadamente {duracao} min
          </span>
        )}
      </div>
      <Button
        onClick={() => navigate(`/treino/${recomendacao.rotinaId}/sessao`)}
        className="brilho-brand mt-7 w-full sm:w-auto sm:min-w-56"
      >
        Começar treino <ArrowRight size={17} />
      </Button>
    </WorkoutCover>
  )
}
