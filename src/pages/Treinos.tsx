import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Lock, X } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
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
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-line bg-card p-6">
        <h2 className="text-[17px] font-semibold">Registrar cardio</h2>

        <div className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1">
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
          className="mt-4 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {enviando ? 'Registrando...' : 'Registrar'}
        </button>
      </div>

      {carregando ? (
        <Empty text="Carregando histórico..." />
      ) : erro ? (
        <Empty text="Não deu pra carregar seu histórico de cardio." />
      ) : sessoes.length === 0 ? (
        <Empty text="Nenhum cardio registrado ainda." />
      ) : (
        <div className="space-y-3">
          {sessoes.map((s) => {
            const ritmo = s.distancia_km ? calcularRitmo(s.distancia_km, s.duracao_min) : null
            return (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3">
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
    <div className="mt-6 space-y-5">
      {limiteAtingido ? (
        <div className="rounded-2xl border border-line bg-card p-4">
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
      ) : (
        <button
          onClick={() => navigate('/treino/nova')}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <Plus size={18} strokeWidth={1.75} />
          Nova rotina
        </button>
      )}

      {carregando ? (
        <Empty text="Carregando suas rotinas..." />
      ) : erro ? (
        <Empty text="Não deu pra carregar suas rotinas. Tenta de novo em instantes." />
      ) : rotinas.length === 0 ? (
        <Empty text="Você ainda não tem nenhuma rotina de treino. Crie a primeira acima." />
      ) : (
        <div className="space-y-4">
          {rotinas.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-[17px] font-semibold">{r.nome}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {r.itens.length === 0 ? 'Nenhum exercício ainda' : r.itens.map((i) => i.exercicio.nome).join(', ')}
              </p>

              <button
                onClick={() => navigate(`/treino/${r.id}/sessao`)}
                disabled={r.itens.length === 0}
                className="mt-4 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                Iniciar rotina
              </button>

              <button
                onClick={() => setExpressAberto((atual) => (atual === r.id ? null : r.id))}
                disabled={r.itens.length === 0}
                className="mt-2 h-10 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover disabled:opacity-60"
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

              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => navigate(`/treino/${r.id}/editar`)}
                  className="h-10 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
                >
                  Editar
                </button>
                <button
                  onClick={() => onApagar(r.id)}
                  disabled={excluindo === r.id}
                  className="h-10 flex-1 rounded-xl border border-line text-sm font-semibold text-down transition-colors hover:bg-card-hover disabled:opacity-60"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
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
    <Page title="Treino">
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setAba('forca')}
          className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
            aba === 'forca' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
          }`}
        >
          Força
        </button>
        <button
          onClick={() => setAba('cardio')}
          className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
            aba === 'cardio' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
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
    </Page>
  )
}
