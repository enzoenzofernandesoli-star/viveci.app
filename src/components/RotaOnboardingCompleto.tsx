import { Navigate, Outlet } from 'react-router-dom'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'

/** Bloqueia o resto do app até o onboarding estar completo. */
export function RotaOnboardingCompleto() {
  const { sessao } = useSessao()
  const { perfil, carregando } = usePerfil(sessao?.user.id)

  if (carregando) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-ink-2">Carregando...</p>
      </div>
    )
  }

  if (!perfil?.onboarding_completo) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
