import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bike, Bolt, ChevronRight, Dumbbell, MoreHorizontal, Plus, Lock, X } from 'lucide-react'
import { Empty } from '../components/Empty'
import { Divider } from '../components/ui/Surface'
import { Eyebrow } from '../components/ui/Typography'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useRotinas, excluirRotina } from '../lib/rotinas'
import { limiteRotinasAtingido } from '../lib/planos'
import { EQUIPAMENTOS_CARDIO, useHistoricoCardio, registrarCardio, removerCardio, type EquipamentoCardio } from '../lib/cardio'
import { calcularRitmo, formatoRitmo } from '../lib/ritmo'
import { useHistoricoTreinos } from '../lib/historicoTreinos'
import { reconstruirTreinoExpress } from '../lib/treinoExpress'
import type { Rotina } from '../lib/rotinas'
import { classificarRotina } from '../lib/categoriaTreino'
import { WorkoutCategoryCover } from '../components/WorkoutCategoryCover'

function formatoBR(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function formatoData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function resumoRotina(rotina: Rotina) {
  const grupos = [...new Set(rotina.itens.map((item) => item.exercicio.grupo_muscular))]
  const resultado = reconstruirTreinoExpress(
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
  )
  return { grupos: grupos.join(' · '), minutos: resultado.tempoOriginalMin }
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
        ativo ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
      }`}
    >
      {children}
    </button>
  )
}

function AbaCardio({ userId }: { userId: string }) {
  const { sessoes, carregando, erro, recarregar } = useHistoricoCardio(userId)
  const [equipamento, setEquipamento] = useState<EquipamentoCardio>('Esteira')
  const [duracao, setDuracao] = useState('')
  const [distancia, setDistancia] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  async function registrar() {
    const duracaoMin = Number(duracao)
    const distanciaKm = distancia.trim() === '' ? null : Number(distancia.replace(',', '.'))
    if (Number.isNaN(duracaoMin) || duracaoMin <= 0) {
      setErroForm('Preenche a duração em minutos.')
      return
    }
    setErroForm(null)
    setEnviando(true)
    try {
      await registrarCardio(userId, { equipamento, duracao_min: Math.round(duracaoMin), distancia_km: distanciaKm })
      setDuracao('')
      setDistancia('')
      recarregar()
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : 'Não deu pra registrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pt-7">
      <div className="border-b border-line/60 pb-9">
        <Eyebrow>Nova sessão</Eyebrow>
        <h2 className="text-[17px] font-semibold">Registrar cardio</h2>

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {EQUIPAMENTOS_CARDIO.map((eq) => (
            <Chip key={eq} ativo={equipamento === eq} onClick={() => setEquipamento(eq)}>
              {eq}
            </Chip>
          ))}
        </div>

        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
              Duração (min)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              placeholder="30"
              className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
              Distância (km)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={distancia}
              onChange={(e) => setDistancia(e.target.value)}
              placeholder="Opcional"
              className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {erroForm && <p className="mt-3 text-sm text-down">{erroForm}</p>}

        <button
          onClick={registrar}
          disabled={enviando}
          className="mt-4 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60 sm:w-48"
        >
          {enviando ? 'Registrando...' : 'Registrar'}
        </button>
      </div>

      <div className="pt-8">
      <Eyebrow>Histórico</Eyebrow>
      {carregando ? (
        <Empty text="Carregando histórico..." />
      ) : erro ? (
        <Empty text="Não deu pra carregar seu histórico de cardio." />
      ) : sessoes.length === 0 ? (
        <Empty text="Nenhum cardio registrado ainda." />
      ) : (
        <div className="mt-5 divide-y divide-line/60 border-y border-line/60">
          {sessoes.map((s) => {
            const ritmo = s.distancia_km ? calcularRitmo(s.distancia_km, s.duracao_min) : null
            return (
              <div key={s.id} className="flex min-h-16 items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{s.equipamento}</p>
                  <p className="mt-0.5 text-xs text-ink-2">
                    {formatoData(s.data)} · {s.duracao_min} min
                    {s.distancia_km ? ` · ${formatoBR(s.distancia_km)} km` : ''}
                    {ritmo ? ` · ${formatoRitmo(ritmo)} min/km` : ''}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await removerCardio(s.id)
                    recarregar()
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-card-hover"
                  aria-label="Remover"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}

const DURACOES_EXPRESS = [15, 20, 30, 35, 45, 60, 90]

function AbaForca({
  userId,
  rotinas,
  carregando,
  erro,
  limiteAtingido,
  excluindo,
  onApagar,
  onCardio,
}: {
  userId: string
  rotinas: ReturnType<typeof useRotinas>['rotinas']
  carregando: boolean
  erro: string | null
  limiteAtingido: boolean
  excluindo: string | null
  onApagar: (id: string) => void
  onCardio: () => void
}) {
  const navigate = useNavigate()
  const historico = useHistoricoTreinos(userId, 3)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [expressAberto, setExpressAberto] = useState(false)
  const [rotinaExpress, setRotinaExpress] = useState<string>('')
  const [duracaoExpress, setDuracaoExpress] = useState<number | null>(null)

  return (
    <div className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.035em]">Suas rotinas</h2>
          <p className="mt-1 text-sm text-ink-2">Escolha uma para começar.</p>
        </div>
        {!limiteAtingido && (
          <button onClick={() => navigate('/treino/nova')} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand">
            <Plus size={17} /> Nova rotina
          </button>
        )}
      </div>
      {limiteAtingido ? (
        <div className="mt-5 border-y border-line/60 py-4">
          <p className="flex items-center justify-center gap-2 text-sm text-ink-2">
            <Lock size={16} strokeWidth={1.75} />
            Você atingiu o limite de 4 rotinas do plano Free.
          </p>
          <button
            onClick={() => navigate('/planos')}
            className="mt-3 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Ver planos
          </button>
        </div>
      ) : null}

      {carregando ? (
        <Empty text="Carregando suas rotinas..." />
      ) : erro ? (
        <Empty text="Não deu pra carregar suas rotinas. Tenta de novo em instantes." />
      ) : rotinas.length === 0 ? (
        <Empty text="Você ainda não tem nenhuma rotina de treino. Crie a primeira acima." />
      ) : (
        <div className="mt-5 border-b border-line/60">
          {rotinas.map((r, i) => {
            const resumo = resumoRotina(r)
            const categoria = classificarRotina(r.itens.map((item) => item.exercicio))
            return <div
              key={r.id}
              className="animar-entrada relative grid gap-5 border-t border-line/60 py-6 first:border-t-0 md:grid-cols-[15rem_1fr]"
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <WorkoutCategoryCover categoria={categoria} />
              <div className="flex min-w-0 flex-col justify-between py-1">
              <div className="flex items-start justify-between gap-3 pr-1">
                <div className="min-w-0">
                  <h2 className="truncate text-[22px] font-semibold leading-none tracking-[-0.045em]">{r.nome}</h2>
                  <p className="mt-2 truncate text-sm text-ink-2">{r.itens.length === 0 ? 'Nenhum exercício ainda' : resumo.grupos}</p>
                  {r.itens.length > 0 && <p className="num mt-1.5 text-xs text-ink-3">{r.itens.length} exercícios · ~{resumo.minutos} min</p>}
                </div>
                <button onClick={() => setMenuAberto((atual) => atual === r.id ? null : r.id)} className="flex size-11 shrink-0 items-center justify-center text-ink-3 hover:text-ink" aria-label={`Mais ações para ${r.nome}`}>
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {menuAberto === r.id && (
                <div className="absolute right-0 top-14 z-10 w-44 rounded-xl border border-line bg-card p-1.5">
                  <button onClick={() => navigate(`/treino/${r.id}/editar`)} className="min-h-11 w-full rounded-lg px-3 text-left text-xs font-semibold text-ink-2 hover:bg-card-hover hover:text-ink">Editar rotina</button>
                  <button onClick={() => { setMenuAberto(null); onApagar(r.id) }} disabled={excluindo === r.id} className="min-h-11 w-full rounded-lg px-3 text-left text-xs font-semibold text-down hover:bg-card-hover disabled:opacity-50">Excluir rotina</button>
                </div>
              )}

              <button
                onClick={() => navigate(`/treino/${r.id}/sessao`)}
                disabled={r.itens.length === 0}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
              >
                Começar <ArrowRight size={16} />
              </button>
              </div>
            </div>
          })}
        </div>
      )}

      <Divider className="my-9" />
      <section aria-labelledby="outras-formas">
        <Eyebrow>Outras formas de treinar</Eyebrow>
        <h2 id="outras-formas" className="mt-2 text-xl font-semibold tracking-[-0.035em]">Escolha como começar</h2>
        <div className="mt-5 divide-y divide-line/60 border-y border-line/60">
          <button onClick={() => navigate('/treino/rapido')} className="group grid min-h-20 w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 text-left">
            <Dumbbell size={19} strokeWidth={1.5} className="text-brand" />
            <span><strong className="block text-sm font-semibold">Treino Rápido</strong><span className="mt-1 block text-xs text-ink-2">Comece uma sessão sem criar uma rotina.</span></span>
            <ArrowRight size={16} className="text-ink-3 group-hover:text-brand" />
          </button>
          <button onClick={() => setExpressAberto(true)} className="group grid min-h-20 w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 text-left">
            <Bolt size={19} strokeWidth={1.5} className="text-silver" />
            <span><strong className="block text-sm font-semibold">Treino Express</strong><span className="mt-1 block text-xs text-ink-2">Adapte uma rotina ao tempo que você tem.</span></span>
            <ChevronRight size={17} className="text-ink-3 group-hover:text-brand" />
          </button>
          <button onClick={onCardio} className="group grid min-h-20 w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 text-left">
            <Bike size={19} strokeWidth={1.5} className="text-silver" />
            <span><strong className="block text-sm font-semibold">Cardio</strong><span className="mt-1 block text-xs text-ink-2">Registre uma atividade cardiovascular.</span></span>
            <ChevronRight size={17} className="text-ink-3 group-hover:text-brand" />
          </button>
        </div>
      </section>

      {!historico.carregando && !historico.erro && historico.treinos.length > 0 && (
        <section className="mt-9 border-t border-line/60 pt-8">
          <Eyebrow>Histórico recente</Eyebrow>
          <div className="mt-4 divide-y divide-line/60 border-y border-line/60">
            {historico.treinos.map((treino) => (
              <div key={treino.id} className="flex min-h-12 items-center justify-between gap-4 text-sm">
                <span className="truncate font-medium">{treino.nome}</span>
                <span className="shrink-0 text-xs uppercase text-ink-3">{new Date(treino.finalizadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {expressAberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="titulo-express">
          <div className="w-full max-w-md rounded-t-2xl border border-line bg-card p-5 sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><Eyebrow>Treino Express</Eyebrow><h2 id="titulo-express" className="mt-2 text-xl font-semibold">Adapte seu treino</h2></div>
              <button onClick={() => setExpressAberto(false)} className="flex size-11 items-center justify-center text-ink-2" aria-label="Fechar"><X size={19} /></button>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">1. Escolha uma rotina</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {rotinas.filter((rotina) => rotina.itens.length > 0).map((rotina) => (
                <button key={rotina.id} onClick={() => setRotinaExpress(rotina.id)} className={`min-h-11 rounded-xl border px-3 text-left text-xs font-semibold ${rotinaExpress === rotina.id ? 'border-brand bg-brand/10 text-brand' : 'border-line text-ink-2'}`}>{rotina.nome}</button>
              ))}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">2. Quanto tempo você tem?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DURACOES_EXPRESS.map((min) => <button key={min} onClick={() => setDuracaoExpress(min)} className={`min-h-11 rounded-xl border text-xs font-semibold ${duracaoExpress === min ? 'border-brand bg-brand/10 text-brand' : 'border-line text-ink-2'}`}>{min} min</button>)}
            </div>
            <button onClick={() => rotinaExpress && duracaoExpress && navigate(`/treino/${rotinaExpress}/sessao?minutos=${duracaoExpress}`)} disabled={!rotinaExpress || !duracaoExpress} className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-40">Criar treino Express</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Treinos() {
  const { sessao } = useSessao()
  const { perfil } = usePerfil(sessao?.user.id)
  const { rotinas, carregando, erro, recarregar } = useRotinas(sessao?.user.id)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [tela, setTela] = useState<'principal' | 'cardio'>('principal')

  const plano = perfil?.plano ?? 'free'
  const limiteAtingido = limiteRotinasAtingido(plano, rotinas.length)

  async function apagar(id: string) {
    setExcluindo(id)
    try {
      await excluirRotina(id)
      recarregar()
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div className="animar-entrada mx-auto w-full max-w-[1120px]">
      <header className="flex min-h-12 items-center border-b border-line/60 pb-4">
        {tela === 'cardio' && <button onClick={() => setTela('principal')} className="mr-2 flex size-11 items-center justify-center text-ink-2" aria-label="Voltar para Treino"><ArrowLeft size={19} /></button>}
        <h1 className="text-[28px] font-semibold tracking-[-0.045em]">{tela === 'principal' ? 'Treino' : 'Cardio'}</h1>
      </header>

      {tela === 'principal' && sessao ? (
        <AbaForca
          userId={sessao.user.id}
          rotinas={rotinas}
          carregando={carregando}
          erro={erro}
          limiteAtingido={limiteAtingido}
          excluindo={excluindo}
          onApagar={apagar}
          onCardio={() => setTela('cardio')}
        />
      ) : sessao ? (
        <AbaCardio userId={sessao.user.id} />
      ) : null}
    </div>
  )
}
