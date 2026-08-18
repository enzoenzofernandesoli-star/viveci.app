import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Settings, ChevronRight, ScanFace } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { GraficoLinha } from '../components/GraficoLinha'
import { useSessao, sair } from '../lib/auth'
import { usePerfil, atualizarPerfil, enviarFotoPerfil } from '../lib/perfil'
import { useRotinas } from '../lib/rotinas'
import { useHistoricoTreinos } from '../lib/historicoTreinos'
import { useMedidas, adicionarMedida } from '../lib/medidas'
import {
  buscarDatasSessoesConcluidas,
  buscarExerciciosTreinados,
  buscarHistoricoExercicio,
  type RegistroDB,
} from '../lib/registros'
import { calcularConsistencia, calcularStreak } from '../lib/consistencia'
import { EXERCICIOS } from '../data/exercicios'
import { ROTULO_PLANO } from '../lib/planos'
import { useVivici } from '../lib/vivici'
import type { DNATreino, PerfilDNA } from '../lib/dnaTreino'
import { useFotosProgresso } from '../lib/bodyScan'
import { LIMITE_BIO } from '../lib/social/limites'

function formatoBR(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function formatoData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatoDuracao(seg: number): string {
  const m = Math.floor(seg / 60)
  return `${m} min`
}

// ───────────────────────────── Aba Treinos ─────────────────────────────

function AbaTreinos({ userId }: { userId: string }) {
  const { treinos, carregando, erro } = useHistoricoTreinos(userId)

  if (carregando) return <Empty text="Carregando seus treinos..." />
  if (erro) return <Empty text="Não deu pra carregar seu histórico." />
  if (treinos.length === 0) return <Empty text="Nenhum treino ainda." />

  return (
    <div className="divide-y divide-line/60 border-y border-line/60">
      {treinos.map((t, i) => (
        <div
          key={t.id}
          className="animar-entrada py-4"
          style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">{t.nome}</p>
            <p className="text-xs text-ink-2">{formatoData(t.finalizadaEm)}</p>
          </div>
          <p className="mt-1 text-xs text-ink-2">
            {t.duracaoSeg !== null && formatoDuracao(t.duracaoSeg)}
            {t.duracaoSeg !== null && t.volumeTotalKg !== null && ' · '}
            {t.volumeTotalKg !== null && `${formatoBR(t.volumeTotalKg)} kg`}
          </p>
        </div>
      ))}
    </div>
  )
}

// ───────────────────────────── Aba Evolução ─────────────────────────────

function CardPeso({ userId }: { userId: string }) {
  const { medidas, carregando, erro, recarregar } = useMedidas(userId)
  const [pesoInput, setPesoInput] = useState('')
  const [enviando, setEnviando] = useState(false)

  const pesos = medidas.filter((m) => m.peso_kg !== null).map((m) => m.peso_kg as number)
  const pesoAtual = pesos.at(-1)

  async function registrarPeso() {
    const peso = Number(pesoInput.replace(',', '.'))
    if (Number.isNaN(peso) || peso <= 0) return
    setEnviando(true)
    try {
      await adicionarMedida(userId, { peso_kg: peso })
      setPesoInput('')
      recarregar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="border-y border-line/60 py-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Peso</p>

      {carregando ? (
        <p className="mt-3 text-sm text-ink-2">Carregando...</p>
      ) : erro ? (
        <p className="mt-3 text-sm text-ink-2">Não deu pra carregar seu histórico de peso.</p>
      ) : pesos.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Nenhum registro de peso ainda.</p>
      ) : (
        <>
          <p className="num mt-3 text-[42px] font-semibold leading-none tracking-[-0.06em]">{formatoBR(pesoAtual!)} kg</p>
          <div className="mt-6">
            <GraficoLinha valores={pesos} />
          </div>
        </>
      )}

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={pesoInput}
          onChange={(e) => setPesoInput(e.target.value)}
          placeholder="Peso hoje (kg)"
          className="h-11 flex-1 rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />
        <button
          onClick={registrarPeso}
          disabled={enviando}
          className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          Registrar
        </button>
      </div>
    </section>
  )
}

function CardConsistencia({ ultimos7Dias, ultimos30Dias }: { ultimos7Dias: number; ultimos30Dias: number }) {
  return (
    <section className="border-b border-line/60 py-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Consistência</p>
      <div className="mt-4 grid grid-cols-2 divide-x divide-line/60">
        <div className="pl-5">
          <p className="num text-[28px] font-bold">{ultimos7Dias}</p>
          <p className="text-xs text-ink-2">treinos nos últimos 7 dias</p>
        </div>
        <div>
          <p className="num text-[28px] font-bold">{ultimos30Dias}</p>
          <p className="text-xs text-ink-2">treinos nos últimos 30 dias</p>
        </div>
      </div>
    </section>
  )
}

function CardCargas({ userId }: { userId: string }) {
  const [exercicioIds, setExercicioIds] = useState<number[] | null>(null)
  const [selecionado, setSelecionado] = useState<number | null>(null)
  const [historico, setHistorico] = useState<RegistroDB[] | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    buscarExerciciosTreinados(userId)
      .then((ids) => {
        if (cancelado) return
        setExercicioIds(ids)
        if (ids.length > 0) setSelecionado(ids[0])
        else setCarregando(false)
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err instanceof Error ? err.message : 'Não deu pra carregar.')
          setCarregando(false)
        }
      })
    return () => {
      cancelado = true
    }
  }, [userId])

  useEffect(() => {
    if (selecionado === null) return
    let cancelado = false
    setCarregando(true)
    buscarHistoricoExercicio(userId, selecionado)
      .then((dados) => {
        if (!cancelado) setHistorico(dados)
      })
      .catch((err) => {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, selecionado])

  return (
    <section className="border-b border-line/60 py-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Progressão de cargas</p>

      {exercicioIds !== null && exercicioIds.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Registre séries nos treinos pra ver sua evolução de carga aqui.</p>
      ) : (
        <>
          {exercicioIds && exercicioIds.length > 0 && (
            <select
              value={selecionado ?? ''}
              onChange={(e) => setSelecionado(Number(e.target.value))}
              className="mt-3 h-11 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {exercicioIds.map((id) => {
                const exercicio = EXERCICIOS.find((e) => e.id === id)
                return (
                  <option key={id} value={id}>
                    {exercicio?.nome ?? id}
                  </option>
                )
              })}
            </select>
          )}

          {carregando ? (
            <p className="mt-3 text-sm text-ink-2">Carregando...</p>
          ) : erro ? (
            <p className="mt-3 text-sm text-ink-2">Não deu pra carregar o histórico.</p>
          ) : historico && historico.length > 0 ? (
            <div className="mt-4">
              <GraficoLinha valores={historico.map((r) => r.peso_kg)} />
              <p className="mt-2 text-xs text-ink-2">
                Última: {formatoBR(historico.at(-1)!.peso_kg)} kg × {historico.at(-1)!.reps}
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

const RES_DNA: [keyof DNATreino, string][] = [
  ['forca', 'Força'],
  ['hipertrofia', 'Hipertrofia'],
  ['consistencia', 'Consistência'],
  ['volume', 'Volume'],
  ['progressao', 'Progressão'],
  ['equilibrio', 'Equilíbrio'],
]

function CardDNA({ dna, perfilDNA }: { dna: DNATreino; perfilDNA: PerfilDNA }) {
  const [cheio, setCheio] = useState(false)
  const semDados = perfilDNA.rotulo === 'SEM DADOS SUFICIENTES'
  useEffect(() => {
    const id = setTimeout(() => setCheio(true), 80)
    return () => clearTimeout(id)
  }, [])

  return (
    <section className="animar-entrada border-b border-line/60 py-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Meu DNA de treino</p>
      <p className="mt-1 text-sm text-brand">{perfilDNA.rotulo}</p>
      <p className="mt-1 text-xs text-ink-2">{perfilDNA.descricao}</p>
      {semDados ? (
        <p className="mt-4 border-y border-line/60 py-4 text-sm text-ink-2">Conclua e registre seus primeiros treinos para liberar os indicadores.</p>
      ) : <div className="mt-4 space-y-3">
        {RES_DNA.map(([chave, rotulo], i) => (
          <div key={chave}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-2">{rotulo}</span>
              <span className="num text-ink">{dna[chave]}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-card-hover">
              <div
                className="h-1.5 rounded-full bg-brand transition-[width] duration-700 ease-out"
                style={{ width: `${cheio ? dna[chave] : 0}%`, transitionDelay: `${i * 60}ms` }}
              />
            </div>
          </div>
        ))}
      </div>}
    </section>
  )
}

function AbaEvolucao({
  userId,
  ultimos7Dias,
  ultimos30Dias,
  diasSemana,
  rotinas,
}: {
  userId: string
  ultimos7Dias: number
  ultimos30Dias: number
  diasSemana: number | null
  rotinas: ReturnType<typeof useRotinas>['rotinas']
}) {
  const { resultado } = useVivici(userId, rotinas, diasSemana, 0, 0)
  const { fotos, carregando: carregandoFotos, erro: erroFotos } = useFotosProgresso(userId)
  const navigate = useNavigate()
  const fotoAtual = fotos[0]

  return (
    <div>
      <section className="pb-8">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Evolução visual</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">Fotos de progresso</h2></div>
          <button onClick={() => navigate('/perfil/body-scan')} className="min-h-11 text-xs font-semibold text-brand">Abrir Body Scan</button>
        </div>
        {carregandoFotos ? <p className="mt-5 text-sm text-ink-2">Carregando fotos...</p> : erroFotos ? <p className="mt-5 text-sm text-ink-2">Não foi possível carregar suas fotos.</p> : fotoAtual ? (
          <button onClick={() => navigate('/perfil/body-scan')} className="mt-5 block w-full text-left">
            <img src={fotoAtual.url} alt={`Progresso — ${fotoAtual.angulo}`} className="aspect-[4/5] max-h-[560px] w-full rounded-2xl object-cover" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink">{formatoData(fotoAtual.data)} · {fotoAtual.angulo}</p>
          </button>
        ) : (
          <div className="mt-5 border-y border-line/60 py-7"><p className="text-sm font-semibold">Ainda não há fotos</p><p className="mt-1 text-sm text-ink-2">Registre sua primeira foto para acompanhar sua evolução.</p><button onClick={() => navigate('/perfil/body-scan')} className="mt-4 min-h-11 text-xs font-semibold text-brand">Adicionar foto</button></div>
        )}
      </section>
      <CardPeso userId={userId} />
      <CardConsistencia ultimos7Dias={ultimos7Dias} ultimos30Dias={ultimos30Dias} />
      <CardCargas userId={userId} />
      {resultado && <CardDNA dna={resultado.dna} perfilDNA={resultado.perfilDNA} />}
    </div>
  )
}

// ───────────────────────────── Editar perfil ─────────────────────────────

function EditarPerfil({
  nomeAtual,
  bioAtual,
  onFechar,
  onSalvar,
}: {
  nomeAtual: string
  bioAtual: string
  onFechar: () => void
  onSalvar: (nome: string, bio: string) => Promise<void>
}) {
  const [nome, setNome] = useState(nomeAtual)
  const [bio, setBio] = useState(bioAtual)
  const [enviando, setEnviando] = useState(false)

  async function salvar() {
    if (nome.trim().length === 0) return
    setEnviando(true)
    try {
      await onSalvar(nome.trim(), bio.trim())
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-line bg-card-hover p-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-app px-3 text-sm text-ink focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Biografia</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={LIMITE_BIO}
          placeholder="Fale um pouco sobre você"
          className="w-full resize-none rounded-xl border border-line bg-app px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />
      </div>
      <div className="flex gap-3">
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

// ───────────────────────────── Página ─────────────────────────────

export default function Perfil() {
  const { sessao } = useSessao()
  const { perfil, recarregar: recarregarPerfil } = usePerfil(sessao?.user.id)
  const { rotinas } = useRotinas(sessao?.user.id)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [aba, setAba] = useState<'perfil' | 'evolucao'>('perfil')
  const [editando, setEditando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  const [datasConcluidas, setDatasConcluidas] = useState<string[]>([])

  useEffect(() => {
    if (!sessao) return
    let cancelado = false
    buscarDatasSessoesConcluidas(sessao.user.id).then((datas) => {
      if (!cancelado) setDatasConcluidas(datas)
    })
    return () => {
      cancelado = true
    }
  }, [sessao])

  if (!sessao || !perfil) {
    return (
      <Page title="Perfil">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  const hoje = new Date().toISOString()
  const { ultimos7Dias, ultimos30Dias } = calcularConsistencia(datasConcluidas, hoje)
  const streak = calcularStreak(datasConcluidas, hoje)

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !sessao) return
    setEnviandoFoto(true)
    try {
      await enviarFotoPerfil(sessao.user.id, arquivo)
      recarregarPerfil()
    } finally {
      setEnviandoFoto(false)
      e.target.value = ''
    }
  }

  return (
    <Page title="Perfil">
      <div className="mt-7 text-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={enviandoFoto}
          className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border border-line bg-card-hover"
        >
          {perfil.foto_url ? (
            <img src={perfil.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink-3">
              {perfil.nome?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          {enviandoFoto && (
            <div className="absolute inset-0 flex items-center justify-center bg-app/60 text-[10px] text-ink">...</div>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />

        <div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <h2 className="truncate text-2xl font-semibold tracking-[-0.045em]">{perfil.nome}</h2>
            <button onClick={() => setEditando((v) => !v)} aria-label="Editar perfil" className="flex size-9 shrink-0 items-center justify-center text-ink-2 hover:text-ink">
              <Pencil size={15} strokeWidth={1.75} />
            </button>
          </div>
          {perfil.bio && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">{perfil.bio}</p>}
        </div>
      </div>

      {editando && (
        <EditarPerfil
          nomeAtual={perfil.nome ?? ''}
          bioAtual={perfil.bio ?? ''}
          onFechar={() => setEditando(false)}
          onSalvar={async (nome, bio) => {
            await atualizarPerfil(sessao.user.id, { nome, bio })
            recarregarPerfil()
            setEditando(false)
          }}
        />
      )}

      <div className="mt-6 grid grid-cols-2 divide-x divide-line/60 border-y border-line/60 py-4 text-center">
        <div>
          <p className="num text-[22px] font-bold">{datasConcluidas.length}</p>
          <p className="text-xs text-ink-2">Treinos</p>
        </div>
        <div>
          <p className="num text-[22px] font-bold text-gold">{streak}</p>
          <p className="text-xs text-ink-2">Sequência</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-b border-line/60 py-3">
        <div className="text-sm text-ink-2">
          Plano {ROTULO_PLANO[perfil.plano]}
        </div>
        <button
          onClick={() => navigate('/planos')}
          className="min-h-11 text-xs font-semibold text-brand"
        >
          Ver planos
        </button>
      </div>

      <button
        onClick={() => navigate('/perfil/configuracoes')}
        className="mt-2 flex min-h-14 w-full items-center gap-3 border-b border-line/60 text-left transition-colors hover:text-brand"
      >
        <Settings size={18} strokeWidth={1.75} className="shrink-0 text-ink-2" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Configurações</p>
          <p className="text-xs text-ink-2">Personalize sua experiência no VIVECI</p>
        </div>
        <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" />
      </button>

      <button
        onClick={() => navigate('/perfil/body-scan')}
        className="flex min-h-14 w-full items-center gap-3 border-b border-line/60 text-left transition-colors hover:text-brand"
      >
        <ScanFace size={18} strokeWidth={1.75} className="shrink-0 text-ink-2" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Body Scan</p>
          <p className="text-xs text-ink-2">Fotos de progresso e comparação de evolução</p>
        </div>
        <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" />
      </button>

      <div className="mt-7 flex border-b border-line/60">
        <button
          onClick={() => setAba('perfil')}
          className={`relative min-h-12 flex-1 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            aba === 'perfil' ? 'text-ink after:absolute after:inset-x-8 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-3'
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setAba('evolucao')}
          className={`relative min-h-12 flex-1 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            aba === 'evolucao' ? 'text-ink after:absolute after:inset-x-8 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-3'
          }`}
        >
          Evolução
        </button>
      </div>

      <div className="mt-5">
        {aba === 'perfil' ? (
          <AbaTreinos userId={sessao.user.id} />
        ) : (
          <AbaEvolucao
            userId={sessao.user.id}
            ultimos7Dias={ultimos7Dias}
            ultimos30Dias={ultimos30Dias}
            diasSemana={perfil.dias_semana}
            rotinas={rotinas}
          />
        )}
      </div>

      <button
        onClick={() => sair()}
        className="mt-8 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
      >
        Sair
      </button>
    </Page>
  )
}
