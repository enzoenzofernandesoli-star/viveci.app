import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bike, Bolt, Dumbbell, Plus, Lock, X } from 'lucide-react'
import { Empty } from '../components/Empty'
import { Divider } from '../components/ui/Surface'
import { Eyebrow } from '../components/ui/Typography'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useRotinas, excluirRotina } from '../lib/rotinas'
import { limiteRotinasAtingido } from '../lib/planos'
import { EQUIPAMENTOS_CARDIO, useHistoricoCardio, registrarCardio, removerCardio, type EquipamentoCardio } from '../lib/cardio'
import { calcularRitmo, formatoRitmo } from '../lib/ritmo'

function formatoBR(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function formatoData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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
  rotinas,
  carregando,
  erro,
  limiteAtingido,
  excluindo,
  onApagar,
}: {
  rotinas: ReturnType<typeof useRotinas>['rotinas']
  carregando: boolean
  erro: string | null
  limiteAtingido: boolean
  excluindo: string | null
  onApagar: (id: string) => void
}) {
  const navigate = useNavigate()
  const [expressAberto, setExpressAberto] = useState<string | null>(null)

  return (
    <div className="pt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Biblioteca pessoal</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">Suas rotinas</h2>
        </div>
        {!limiteAtingido && (
          <button onClick={() => navigate('/treino/nova')} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand">
            <Plus size={16} /> Nova rotina
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
          {rotinas.map((r, i) => (
            <div
              key={r.id}
              className="animar-entrada border-t border-line/60 py-6 first:border-t-0"
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <p className="num text-[10px] font-semibold text-brand">{String(i + 1).padStart(2, '0')}</p>
              <h2 className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.05em]">{r.nome}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {r.itens.length === 0 ? 'Nenhum exercício ainda' : r.itens.map((i) => i.exercicio.nome).join(', ')}
              </p>

              <button
                onClick={() => navigate(`/treino/${r.id}/sessao`)}
                disabled={r.itens.length === 0}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
              >
                Iniciar <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setExpressAberto((atual) => (atual === r.id ? null : r.id))}
                disabled={r.itens.length === 0}
                className="mt-2 min-h-11 w-full text-left text-xs font-semibold text-ink-2 transition-colors hover:text-brand disabled:opacity-60 sm:ml-5 sm:w-auto"
              >
                Treino express
              </button>

              {expressAberto === r.id && (
                <div className="mt-3 rounded-xl border border-line bg-card-hover p-4">
                  <p className="text-xs text-ink-2">Quanto tempo você tem hoje?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DURACOES_EXPRESS.map((min) => (
                      <button
                        key={min}
                        onClick={() => navigate(`/treino/${r.id}/sessao?minutos=${min}`)}
                        className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
                      >
                        {min} min
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 flex gap-5">
                <button
                  onClick={() => navigate(`/treino/${r.id}/editar`)}
                  className="min-h-11 text-xs font-semibold text-ink-2 transition-colors hover:text-ink"
                >
                  Editar
                </button>
                <button
                  onClick={() => onApagar(r.id)}
                  disabled={excluindo === r.id}
                  className="min-h-11 text-xs font-semibold text-ink-3 transition-colors hover:text-down disabled:opacity-60"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
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
          <div className="grid min-h-20 grid-cols-[2.5rem_1fr] items-center gap-3">
            <Bolt size={19} strokeWidth={1.5} className="text-silver" />
            <span><strong className="block text-sm font-semibold">Treino Express</strong><span className="mt-1 block text-xs text-ink-2">Escolha o tempo em uma das suas rotinas.</span></span>
          </div>
          <div className="grid min-h-20 grid-cols-[2.5rem_1fr] items-center gap-3">
            <Bike size={19} strokeWidth={1.5} className="text-silver" />
            <span><strong className="block text-sm font-semibold">Cardio</strong><span className="mt-1 block text-xs text-ink-2">Abra a aba acima para registrar sua sessão.</span></span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function Treinos() {
  const { sessao } = useSessao()
  const { perfil } = usePerfil(sessao?.user.id)
  const { rotinas, carregando, erro, recarregar } = useRotinas(sessao?.user.id)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [aba, setAba] = useState<'forca' | 'cardio'>('forca')

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
      <header className="border-b border-line/60 pb-5">
        <Eyebrow>VIVECI / Performance</Eyebrow>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">Treino</h1>
      </header>
      <div className="flex border-b border-line/60">
        <button
          onClick={() => setAba('forca')}
          className={`relative min-h-12 px-5 text-xs font-semibold transition-colors ${
            aba === 'forca' ? 'text-brand after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-2'
          }`}
        >
          Força
        </button>
        <button
          onClick={() => setAba('cardio')}
          className={`relative min-h-12 px-5 text-xs font-semibold transition-colors ${
            aba === 'cardio' ? 'text-brand after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-2'
          }`}
        >
          Cardio
        </button>
      </div>

      {aba === 'forca' ? (
        <AbaForca
          rotinas={rotinas}
          carregando={carregando}
          erro={erro}
          limiteAtingido={limiteAtingido}
          excluindo={excluindo}
          onApagar={apagar}
        />
      ) : sessao ? (
        <AbaCardio userId={sessao.user.id} />
      ) : null}
    </div>
  )
}
