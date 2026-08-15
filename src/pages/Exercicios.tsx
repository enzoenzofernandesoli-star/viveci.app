import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { EXERCICIOS, type GrupoMuscular } from '../data/exercicios'
import { ROTULO_NIVEL } from '../lib/perfil'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { exercicioBloqueado } from '../lib/planos'

const GRUPOS: GrupoMuscular[] = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Panturrilha',
  'Abdômen',
]

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors ${
        ativo ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
      }`}
    >
      {children}
    </button>
  )
}

export default function Exercicios() {
  const navigate = useNavigate()
  const { sessao } = useSessao()
  const { perfil } = usePerfil(sessao?.user.id)
  const plano = perfil?.plano ?? 'free'

  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState<GrupoMuscular | 'todos'>('todos')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return EXERCICIOS.filter((ex) => {
      const bateGrupo = grupo === 'todos' || ex.grupo_muscular === grupo
      const bateBusca = termo === '' || ex.nome.toLowerCase().includes(termo)
      return bateGrupo && bateBusca
    })
  }, [busca, grupo])

  const algumBloqueado = filtrados.some((ex) => exercicioBloqueado(plano, ex.id - 1))

  return (
    <Page title="Exercícios">
      <div className="mt-6">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar exercício"
          className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip ativo={grupo === 'todos'} onClick={() => setGrupo('todos')}>
            Todos
          </Chip>
          {GRUPOS.map((g) => (
            <Chip key={g} ativo={grupo === g} onClick={() => setGrupo(g)}>
              {g}
            </Chip>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <Empty text="Nenhum exercício encontrado." />
        ) : (
          <div className="mt-4 space-y-3">
            {filtrados.map((ex) => {
              const bloqueado = exercicioBloqueado(plano, ex.id - 1)
              return (
                <div
                  key={ex.id}
                  className={`rounded-xl border border-line bg-card px-4 py-3 ${bloqueado ? 'pointer-events-none select-none blur-[3px]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{ex.nome}</p>
                    {bloqueado ? (
                      <Lock strokeWidth={1.75} className="h-4 w-4 text-ink-2" />
                    ) : (
                      ex.is_composto && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand">
                          Composto
                        </span>
                      )
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-2">
                    {ex.grupo_muscular}
                    {ex.grupos_secundarios.length > 0 && ` · ${ex.grupos_secundarios.join(', ')}`}
                  </p>
                  <p className="mt-1 text-xs text-ink-2">
                    {ex.equipamento} · {ROTULO_NIVEL[ex.nivel]}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {algumBloqueado && (
          <button
            onClick={() => navigate('/planos')}
            className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Ver planos
          </button>
        )}
      </div>
    </Page>
  )
}
