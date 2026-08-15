import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useSessao } from '../lib/auth'
import { usePerfil, atualizarPerfil, ROTULO_OBJETIVO, type Sexo, type Objetivo } from '../lib/perfil'

const TOTAL_PASSOS = 6

type Respostas = {
  nome: string
  sexo: Sexo | null
  idade: string
  altura_cm: string
  peso_kg: string
  objetivo: Objetivo | null
  dias_semana: number | null
}

const RESPOSTAS_INICIAIS: Respostas = {
  nome: '',
  sexo: null,
  idade: '',
  altura_cm: '',
  peso_kg: '',
  objetivo: null,
  dias_semana: null,
}

function passoValido(passo: number, r: Respostas): boolean {
  switch (passo) {
    case 0:
      return r.nome.trim().length >= 2
    case 1:
      return r.sexo !== null
    case 2: {
      const n = Number(r.idade)
      return n >= 14 && n <= 90
    }
    case 3: {
      const altura = Number(r.altura_cm)
      const peso = Number(r.peso_kg.replace(',', '.'))
      return altura >= 120 && altura <= 230 && peso >= 30 && peso <= 250
    }
    case 4:
      return r.objetivo !== null
    case 5:
      return r.dias_semana !== null
    default:
      return false
  }
}

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="text-[22px] font-bold leading-snug">{children}</h2>
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-xl px-4 text-sm font-semibold transition-colors ${
        ativo ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
      }`}
    >
      {children}
    </button>
  )
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  tipo = 'text',
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  tipo?: string
  inputMode?: 'numeric' | 'decimal'
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">{label}</label>
      <input
        type={tipo}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
      />
    </div>
  )
}

export default function Onboarding() {
  const { sessao } = useSessao()
  const userId = sessao?.user.id
  const { perfil, carregando } = usePerfil(userId)
  const navigate = useNavigate()

  const [passo, setPasso] = useState(0)
  const [r, setR] = useState<Respostas>(RESPOSTAS_INICIAIS)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (carregando) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-ink-2">Carregando...</p>
      </div>
    )
  }

  if (perfil?.onboarding_completo) return <Navigate to="/" replace />

  const valido = passoValido(passo, r)
  const ultimoPasso = passo === TOTAL_PASSOS - 1

  async function avancar() {
    if (!valido) return
    if (!ultimoPasso) {
      setPasso((p) => p + 1)
      return
    }
    if (!userId) return
    setEnviando(true)
    setErro(null)
    try {
      await atualizarPerfil(userId, {
        nome: r.nome.trim(),
        sexo: r.sexo,
        idade: Number(r.idade),
        altura_cm: Number(r.altura_cm),
        peso_kg: Number(r.peso_kg.replace(',', '.')),
        objetivo: r.objetivo,
        dias_semana: r.dias_semana,
        onboarding_completo: true,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  function voltar() {
    setPasso((p) => Math.max(0, p - 1))
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="text-xl" />
        </div>

        <div className="mb-6 flex gap-1.5">
          {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-brand' : 'bg-card-hover'}`} />
          ))}
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
            Passo {passo + 1} de {TOTAL_PASSOS}
          </p>

          <div className="mt-3 space-y-5">
            {passo === 0 && (
              <>
                <Titulo>Como podemos te chamar?</Titulo>
                <Campo label="Nome" value={r.nome} onChange={(v) => setR({ ...r, nome: v })} placeholder="Seu nome" />
              </>
            )}

            {passo === 1 && (
              <>
                <Titulo>Qual seu sexo biológico?</Titulo>
                <p className="text-sm text-ink-2">Usamos isso só pra calcular sua meta calórica com mais precisão.</p>
                <div className="flex gap-3">
                  <Chip ativo={r.sexo === 'masculino'} onClick={() => setR({ ...r, sexo: 'masculino' })}>
                    Masculino
                  </Chip>
                  <Chip ativo={r.sexo === 'feminino'} onClick={() => setR({ ...r, sexo: 'feminino' })}>
                    Feminino
                  </Chip>
                </div>
              </>
            )}

            {passo === 2 && (
              <>
                <Titulo>Qual sua idade?</Titulo>
                <Campo label="Idade" tipo="number" value={r.idade} onChange={(v) => setR({ ...r, idade: v })} placeholder="Anos" />
              </>
            )}

            {passo === 3 && (
              <>
                <Titulo>Altura e peso</Titulo>
                <Campo label="Altura (cm)" tipo="number" value={r.altura_cm} onChange={(v) => setR({ ...r, altura_cm: v })} placeholder="Ex: 178" />
                <Campo label="Peso (kg)" tipo="text" inputMode="decimal" value={r.peso_kg} onChange={(v) => setR({ ...r, peso_kg: v })} placeholder="Ex: 75,2" />
              </>
            )}

            {passo === 4 && (
              <>
                <Titulo>Qual seu objetivo?</Titulo>
                <div className="flex flex-wrap gap-3">
                  {(Object.entries(ROTULO_OBJETIVO) as [Objetivo, string][]).map(([valor, rotulo]) => (
                    <Chip key={valor} ativo={r.objetivo === valor} onClick={() => setR({ ...r, objetivo: valor })}>
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {passo === 5 && (
              <>
                <Titulo>Quantos dias por semana?</Titulo>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5, 6].map((dias) => (
                    <Chip key={dias} ativo={r.dias_semana === dias} onClick={() => setR({ ...r, dias_semana: dias })}>
                      {dias}x
                    </Chip>
                  ))}
                </div>
              </>
            )}
          </div>

          {erro && <p className="mt-4 text-sm text-down">{erro}</p>}

          <div className="mt-6 flex gap-3">
            {passo > 0 && (
              <button
                type="button"
                onClick={voltar}
                className="h-12 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={avancar}
              disabled={!valido || enviando}
              className="h-12 flex-1 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {enviando ? 'Salvando...' : ultimoPasso ? 'Concluir' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
