import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Dumbbell, X } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { SeletorExercicio } from '../components/SeletorExercicio'
import { useSessao } from '../lib/auth'
import { useRotina, criarRotina, renomearRotina, salvarItensRotina } from '../lib/rotinas'
import { EXERCICIOS, type Exercicio } from '../data/exercicios'

type ItemDraft = { exercicioId: number; exercicio: Exercicio }

export default function RotinaEditor() {
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)
  const { sessao } = useSessao()
  const { rotina, carregando } = useRotina(id)
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [itens, setItens] = useState<ItemDraft[]>([])
  const [mostrarSeletor, setMostrarSeletor] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregou, setCarregou] = useState(false)

  useEffect(() => {
    if (editando && rotina && !carregou) {
      setNome(rotina.nome)
      setItens(rotina.itens.map((i) => ({ exercicioId: i.exercicio_id, exercicio: i.exercicio })))
      setCarregou(true)
    }
  }, [editando, rotina, carregou])

  if (editando && carregando) {
    return (
      <Page title="Editar rotina">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  function adicionarExercicio(exercicioId: number) {
    const exercicio = EXERCICIOS.find((e) => e.id === exercicioId)!
    setItens((atual) => [...atual, { exercicioId, exercicio }])
    setMostrarSeletor(false)
  }

  function removerExercicio(indice: number) {
    setItens((atual) => atual.filter((_, i) => i !== indice))
  }

  async function salvar() {
    if (!sessao || nome.trim().length === 0) {
      setErro('Dá um nome pra rotina antes de salvar.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      if (editando && rotina) {
        await renomearRotina(rotina.id, nome.trim())
        await salvarItensRotina(
          rotina.sessaoId,
          itens.map((i) => i.exercicioId),
        )
      } else {
        const { sessaoId } = await criarRotina(sessao.user.id, nome.trim())
        await salvarItensRotina(
          sessaoId,
          itens.map((i) => i.exercicioId),
        )
      }
      navigate('/treino', { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra salvar a rotina.')
    } finally {
      setSalvando(false)
    }
  }

  if (mostrarSeletor) {
    return (
      <Page title="Adicionar exercício">
        <div className="mt-6">
          <SeletorExercicio onSelecionar={adicionarExercicio} />
          <button
            onClick={() => setMostrarSeletor(false)}
            className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            Cancelar
          </button>
        </div>
      </Page>
    )
  }

  return (
    <Page title={editando ? 'Editar rotina' : 'Nova rotina'}>
      <div className="mt-6 space-y-5">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Título da rotina"
          className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />

        {itens.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-8 text-center">
            <Dumbbell strokeWidth={1.75} className="mx-auto h-8 w-8 text-ink-3" />
            <p className="mt-3 text-sm text-ink-2">Comece por adicionar um exercício à sua rotina.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {itens.map((item, i) => (
              <div
                key={`${item.exercicioId}-${i}`}
                className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{item.exercicio.nome}</p>
                  <p className="text-xs text-ink-2">{item.exercicio.grupo_muscular}</p>
                </div>
                <button
                  onClick={() => removerExercicio(i)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-card-hover"
                  aria-label="Remover exercício"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setMostrarSeletor(true)}
          className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          + Adicionar exercício
        </button>

        {erro && <p className="text-sm text-down">{erro}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/treino')}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="h-12 flex-1 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Page>
  )
}
