import { Navigate, Outlet } from 'react-router-dom'
import { useSessao } from '../lib/auth'

/** Bloqueia rotas até haver sessão. Redireciona pra /login quando não há. */
export function RotaProtegida() {
  const { sessao, carregando } = useSessao()

  if (carregando) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-ink-2">Carregando...</p>
      </div>
    )
  }

  if (!sessao) return <Navigate to="/login" replace />

  return <Outlet />
}
