import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { Bloqueado } from '../components/Bloqueado'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useProximoTreino } from '../lib/plano'
import { semanaBloqueada } from '../lib/planos'

export default function Treinos() {
  const { sessao } = useSessao()
  const { perfil, carregando: carregandoPerfil } = usePerfil(sessao?.user.id)
  const { dados, carregando, erro } = useProximoTreino(sessao?.user.id, perfil)
  const navigate = useNavigate()

  if (carregandoPerfil || carregando) {
    return (
      <Page title="Treinos">
        <Empty text="Montando seu treino..." />
      </Page>
    )
  }

  if (erro || !dados) {
    return (
      <Page title="Treinos">
        <Empty text="Não deu pra carregar seu treino. Tenta de novo em instantes." />
      </Page>
    )
  }

  const { sessao: sessaoTreino, itens } = dados
  const plano = perfil?.plano ?? 'free'
  const bloqueado = semanaBloqueada(plano, sessaoTreino.semana)

  const conteudo = (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
        Semana {sessaoTreino.semana} de 12
      </p>
      <h2 className="mt-1 text-[17px] font-semibold">{sessaoTreino.nome_sessao}</h2>

      <div className="mt-5 space-y-3">
        {itens.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{item.exercicio.nome}</p>
              <p className="text-xs text-ink-2">{item.exercicio.grupo_muscular}</p>
            </div>
            <p className="num text-sm text-ink-2">
              {item.series}x{item.reps_min}-{item.reps_max}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/treinos/sessao')}
        disabled={bloqueado}
        className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        Iniciar treino
      </button>
    </div>
  )

  return <Page title="Treinos">{bloqueado ? <div className="mt-6"><Bloqueado>{conteudo}</Bloqueado></div> : <div className="mt-6">{conteudo}</div>}</Page>
}
