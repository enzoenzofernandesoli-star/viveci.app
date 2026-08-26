import { Navigate, Outlet } from 'react-router-dom'
import { sair, useSessao } from '../lib/auth'
import { useContaBanida } from '../lib/social/host'

/** Bloqueia rotas até haver sessão. Redireciona pra /login quando não há. */
export function RotaProtegida() {
  const { sessao, carregando } = useSessao()
  const statusBanimento = useContaBanida(sessao?.user.id)

  if (carregando || statusBanimento.carregando) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-ink-2">Carregando...</p>
      </div>
    )
  }

  if (!sessao) return <Navigate to="/login" replace />
  if (statusBanimento.erro) return <div className="flex min-h-dvh flex-col items-center justify-center bg-app px-6 text-center">
    <h1 className="text-xl font-semibold text-ink">Não foi possível verificar seu acesso.</h1>
    <p className="mt-2 text-sm text-ink-2">Confira sua conexão e tente novamente.</p>
    <button onClick={() => window.location.reload()} className="mt-6 min-h-12 rounded-xl bg-brand px-8 text-sm font-semibold text-white">Tentar novamente</button>
  </div>
  if (statusBanimento.banida) return <div className="flex min-h-dvh flex-col items-center justify-center bg-app px-6 text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-down">Conta suspensa</p>
    <h1 className="mt-2 text-2xl font-semibold text-ink">Seu acesso ao VIVECI foi bloqueado.</h1>
    <p className="mt-2 max-w-sm text-sm leading-6 text-ink-2">Entre em contato com o suporte se acreditar que houve um engano.</p>
    <button onClick={sair} className="mt-6 min-h-12 rounded-xl bg-brand px-8 text-sm font-semibold text-white">Sair</button>
  </div>

  return <Outlet />
}
