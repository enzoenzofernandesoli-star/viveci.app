import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { useSessao } from '../lib/auth'
import { useRotinas, excluirRotina } from '../lib/rotinas'

export default function Treinos() {
  const { sessao } = useSessao()
  const { rotinas, carregando, erro, recarregar } = useRotinas(sessao?.user.id)
  const navigate = useNavigate()
  const [excluindo, setExcluindo] = useState<string | null>(null)

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
      <div className="mt-6 space-y-5">
        <button
          onClick={() => navigate('/treino/nova')}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <Plus size={18} strokeWidth={1.75} />
          Nova rotina
        </button>

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
                  {r.itens.length === 0
                    ? 'Nenhum exercício ainda'
                    : r.itens.map((i) => i.exercicio.nome).join(', ')}
                </p>

                <button
                  onClick={() => navigate(`/treino/${r.id}/sessao`)}
                  disabled={r.itens.length === 0}
                  className="mt-4 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  Iniciar rotina
                </button>

                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => navigate(`/treino/${r.id}/editar`)}
                    className="h-10 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => apagar(r.id)}
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
    </Page>
  )
}
