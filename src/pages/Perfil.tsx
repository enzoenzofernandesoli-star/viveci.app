import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { useSessao, sair } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { ROTULO_PLANO } from '../lib/planos'

export default function Perfil() {
  const { sessao } = useSessao()
  const { perfil } = usePerfil(sessao?.user.id)
  const navigate = useNavigate()

  return (
    <Page title="Perfil">
      <div className="mt-6 rounded-2xl border border-line bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Email</p>
        <p className="mt-1 text-sm text-ink">{sessao?.user.email}</p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Plano</p>
        <p className="mt-1 text-sm text-ink">{ROTULO_PLANO[perfil?.plano ?? 'free']}</p>

        <button
          onClick={() => navigate('/planos')}
          className="mt-6 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Ver planos
        </button>

        <button
          onClick={() => sair()}
          className="mt-3 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
        >
          Sair
        </button>
      </div>
    </Page>
  )
}
