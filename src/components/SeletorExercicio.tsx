import { useMemo, useState } from 'react'
import { EXERCICIOS, type GrupoMuscular } from '../data/exercicios'
import { ROTULO_NIVEL } from '../lib/perfil'

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

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors ${
        ativo ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
      }`}
    >
      {children}
    </button>
  )
}

/** Busca + filtro por grupo muscular pra escolher exercícios pra uma rotina. */
export function SeletorExercicio({
  onSelecionar,
  selecionados = [],
}: {
  onSelecionar: (exercicioId: number) => void
  selecionados?: number[]
}) {
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

  return (
    <div>
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
        <p className="mt-6 text-center text-sm text-ink-2">Nenhum exercício encontrado.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtrados.map((ex) => {
            const selecionado = selecionados.includes(ex.id)
            return (
            <button
              key={ex.id}
              onClick={() => onSelecionar(ex.id)}
              disabled={selecionado}
              className="flex min-h-20 w-full items-center gap-3 rounded-xl border border-line bg-card px-3 py-3 text-left transition-colors hover:bg-card-hover disabled:cursor-default disabled:opacity-50"
            >
              <img src={ex.gif} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-lg bg-card-hover object-cover" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{ex.nome}</p>
                <p className="mt-1 text-xs text-ink-2">
                  {ex.grupo_muscular}
                  {ex.grupos_secundarios.length > 0 && ` · ${ex.grupos_secundarios.join(', ')}`}
                </p>
                <p className="mt-1 text-xs text-ink-2">
                  {selecionado ? 'Já adicionado' : `${ex.equipamento} · ${ROTULO_NIVEL[ex.nivel]}`}
                </p>
              </div>
            </button>
          )})}
        </div>
      )}
    </div>
  )
}
