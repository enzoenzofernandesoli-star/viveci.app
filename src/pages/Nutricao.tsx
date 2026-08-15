import { useMemo, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import type { Perfil } from '../lib/perfil'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useMetaAtiva, definirMetaManual } from '../lib/metaManual'
import { useDia, somar, adicionarItem, removerItem, type ItemDiario } from '../lib/diario'
import { hojeISO } from '../lib/data'
import { REFEICOES, REFEICOES_PRINCIPAIS, type Refeicao } from '../lib/refeicoes'
import { ALIMENTOS, type Alimento } from '../data/alimentos'
import { calcularMacrosPorQuantidade } from '../lib/alimentos'

function formatoBR(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

function formatoBR1(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
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

function BarraMacro({ label, consumido, meta, cor }: { label: string; consumido: number; meta: number; cor: string }) {
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
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
      </div>
    </div>
  )
}

function EditarMeta({
  metaAtual,
  onFechar,
  onSalvar,
}: {
  metaAtual: number
  onFechar: () => void
  onSalvar: (novoKcal: number) => Promise<void>
}) {
  const [valor, setValor] = useState(String(metaAtual))
  const [enviando, setEnviando] = useState(false)

  async function salvar() {
    const novoKcal = Number(valor.replace(',', '.'))
    if (Number.isNaN(novoKcal) || novoKcal <= 0) return
    setEnviando(true)
    try {
      await onSalvar(novoKcal)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-card-hover p-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
        Meta de calorias (kcal)
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        autoFocus
        className="h-12 w-full rounded-xl border border-line bg-app px-3 text-sm text-ink focus:border-brand focus:outline-none"
      />
      <div className="mt-3 flex gap-3">
        <button
          onClick={onFechar}
          className="h-10 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card"
        >
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={enviando}
          className="h-10 flex-1 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {enviando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function AdicionarAlimento({
  refeicao,
  onFechar,
  onAdicionar,
}: {
  refeicao: Refeicao
  onFechar: () => void
  onAdicionar: (dados: Omit<ItemDiario, 'id' | 'data' | 'refeicao'>) => Promise<void>
}) {
  const [aba, setAba] = useState<'buscar' | 'rapida'>('buscar')
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<Alimento | null>(null)
  const [quantidade, setQuantidade] = useState('100')
  const [nomeRapido, setNomeRapido] = useState('')
  const [kcalRapido, setKcalRapido] = useState('')
  const [protRapido, setProtRapido] = useState('')
  const [enviando, setEnviando] = useState(false)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (termo === '') return []
    return ALIMENTOS.filter((a) => a.nome.toLowerCase().includes(termo)).slice(0, 20)
  }, [busca])

  const qtdNum = Number(quantidade.replace(',', '.'))
  const macrosPreview = selecionado && qtdNum > 0 ? calcularMacrosPorQuantidade(selecionado, qtdNum) : null

  async function confirmarAlimento() {
    if (!selecionado || !macrosPreview) return
    setEnviando(true)
    try {
      await onAdicionar({
        origem: 'alimento',
        nome: selecionado.nome,
        alimento_id: selecionado.id,
        quantidade: qtdNum,
        ...macrosPreview,
      })
    } finally {
      setEnviando(false)
    }
  }

  async function confirmarRapida() {
    const kcal = Number(kcalRapido.replace(',', '.'))
    const prot = Number(protRapido.replace(',', '.') || '0')
    if (nomeRapido.trim().length === 0 || Number.isNaN(kcal) || kcal <= 0) return
    setEnviando(true)
    try {
      await onAdicionar({
        origem: 'rapida',
        nome: nomeRapido.trim(),
        alimento_id: null,
        quantidade: null,
        kcal: Math.round(kcal),
        prot_g: Number.isNaN(prot) ? 0 : prot,
        carb_g: 0,
        gord_g: 0,
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Page title={`Adicionar em ${refeicao}`}>
      <div className="mt-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAba('buscar')}
            className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
              aba === 'buscar' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Buscar alimento
          </button>
          <button
            type="button"
            onClick={() => setAba('rapida')}
            className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
              aba === 'rapida' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Entrada rápida
          </button>
        </div>

        {aba === 'buscar' ? (
          <div className="mt-5">
            {selecionado ? (
              <div className="rounded-2xl border border-line bg-card p-6">
                <p className="text-[17px] font-semibold text-ink">{selecionado.nome}</p>
                <label className="mb-1.5 mt-4 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
                  Quantidade (g)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none"
                />
                {macrosPreview && (
                  <p className="mt-3 text-sm text-ink-2">
                    <span className="num text-ink">{macrosPreview.kcal} kcal</span> · P {formatoBR1(macrosPreview.prot_g)}g · C{' '}
                    {formatoBR1(macrosPreview.carb_g)}g · G {formatoBR1(macrosPreview.gord_g)}g
                  </p>
                )}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setSelecionado(null)}
                    className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
                  >
                    Trocar
                  </button>
                  <button
                    onClick={confirmarAlimento}
                    disabled={enviando || !macrosPreview}
                    className="h-11 flex-1 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
                  >
                    {enviando ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar alimento"
                  className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                  autoFocus
                />
                <div className="mt-4 space-y-2">
                  {filtrados.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelecionado(a)}
                      className="w-full rounded-xl border border-line bg-card px-4 py-3 text-left transition-colors hover:bg-card-hover"
                    >
                      <p className="text-sm font-medium text-ink">{a.nome}</p>
                      <p className="mt-0.5 text-xs text-ink-2">
                        {a.kcal_100} kcal / 100g · {a.categoria}
                      </p>
                    </button>
                  ))}
                  {busca.trim() !== '' && filtrados.length === 0 && (
                    <p className="mt-4 text-center text-sm text-ink-2">Nenhum alimento encontrado.</p>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4 rounded-2xl border border-line bg-card p-6">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Nome</label>
              <input
                type="text"
                value={nomeRapido}
                onChange={(e) => setNomeRapido(e.target.value)}
                placeholder="O que você comeu"
                className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Calorias</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={kcalRapido}
                  onChange={(e) => setKcalRapido(e.target.value)}
                  placeholder="kcal"
                  className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Proteína (g)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={protRapido}
                  onChange={(e) => setProtRapido(e.target.value)}
                  placeholder="Opcional"
                  className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={confirmarRapida}
              disabled={enviando}
              className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {enviando ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        )}

        <button
          onClick={onFechar}
          className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
        >
          Cancelar
        </button>
      </div>
    </Page>
  )
}

export default function Nutricao() {
  const { sessao } = useSessao()
  const { perfil, carregando, erro } = usePerfil(sessao?.user.id)
  const hoje = hojeISO()
  const { itens, carregando: carregandoDia, recarregar } = useDia(sessao?.user.id, hoje)
  const consumido = somar(itens)

  const [refeicaoAdicionando, setRefeicaoAdicionando] = useState<Refeicao | null>(null)
  const [editandoMeta, setEditandoMeta] = useState(false)

  const perfilCalculo: Perfil | null =
    perfil?.nome && perfil.sexo && perfil.idade && perfil.altura_cm && perfil.peso_kg && perfil.dias_semana && perfil.objetivo
      ? {
          nome: perfil.nome,
          sexo: perfil.sexo,
          idade: perfil.idade,
          altura_cm: perfil.altura_cm,
          peso_kg: perfil.peso_kg,
          dias_semana: perfil.dias_semana,
          objetivo: perfil.objetivo,
        }
      : null

  const { metas, carregando: carregandoMeta, recarregar: recarregarMeta } = useMetaAtiva(sessao?.user.id, perfilCalculo)

  if (carregando || carregandoMeta) {
    return (
      <Page title="Nutrição">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  if (erro || !perfil || !sessao || !metas) {
    return (
      <Page title="Nutrição">
        <Empty text="Não deu pra carregar seu perfil. Tenta de novo em instantes." />
      </Page>
    )
  }

  if (refeicaoAdicionando) {
    return (
      <AdicionarAlimento
        refeicao={refeicaoAdicionando}
        onFechar={() => setRefeicaoAdicionando(null)}
        onAdicionar={async (dados) => {
          await adicionarItem(sessao.user.id, { ...dados, data: hoje, refeicao: refeicaoAdicionando })
          recarregar()
          setRefeicaoAdicionando(null)
        }}
      />
    )
  }

  const outrasComItens = REFEICOES.filter(
    (r) => !REFEICOES_PRINCIPAIS.includes(r) && itens.some((i) => i.refeicao === r),
  )
  const refeicoesExibidas = [...REFEICOES_PRINCIPAIS, ...outrasComItens]

  return (
    <Page title="Nutrição">
      <div className="mt-6 rounded-2xl border border-line bg-card p-6">
        <AnelCalorias consumido={consumido.kcal} meta={metas.meta_kcal} />

        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setEditandoMeta((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink"
          >
            <Pencil size={13} strokeWidth={1.75} />
            Editar meta de calorias
          </button>
        </div>

        {editandoMeta && (
          <EditarMeta
            metaAtual={metas.meta_kcal}
            onFechar={() => setEditandoMeta(false)}
            onSalvar={async (novoKcal) => {
              await definirMetaManual(sessao.user.id, metas, novoKcal, perfilCalculo!.peso_kg)
              recarregarMeta()
              setEditandoMeta(false)
            }}
          />
        )}

        <div className="mt-8 space-y-5">
          <BarraMacro label="Proteína" consumido={consumido.prot_g} meta={metas.meta_prot_g} cor="#2F6BFF" />
          <BarraMacro label="Carboidrato" consumido={consumido.carb_g} meta={metas.meta_carb_g} cor="#8B5CF6" />
          <BarraMacro label="Gordura" consumido={consumido.gord_g} meta={metas.meta_gord_g} cor="#F5A524" />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {carregandoDia ? (
          <Empty text="Carregando refeições..." />
        ) : (
          refeicoesExibidas.map((refeicao) => {
            const itensRefeicao = itens.filter((i) => i.refeicao === refeicao)
            return (
              <div key={refeicao} className="rounded-2xl border border-line bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold">{refeicao}</h2>
                  <button
                    onClick={() => setRefeicaoAdicionando(refeicao)}
                    className="text-sm font-semibold text-brand"
                  >
                    + Adicionar
                  </button>
                </div>

                {itensRefeicao.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-2">Nada registrado ainda.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {itensRefeicao.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl bg-card-hover px-3 py-2">
                        <div>
                          <p className="text-sm text-ink">{item.nome}</p>
                          <p className="text-xs text-ink-2">
                            {item.quantidade ? `${formatoBR(item.quantidade)}g · ` : ''}
                            {formatoBR(item.kcal)} kcal
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            await removerItem(item.id)
                            recarregar()
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-card"
                          aria-label="Remover"
                        >
                          <X size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Page>
  )
}
