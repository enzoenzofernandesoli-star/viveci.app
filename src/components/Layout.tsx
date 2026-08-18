import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Logo } from './Logo'
import { useSessao } from '../lib/auth'
import { usePreferencias } from '../lib/preferencias'

export function Layout() {
  const { sessao } = useSessao()
  const { preferencias } = usePreferencias(sessao?.user.id)

  useEffect(() => {
    const reduzir = preferencias.reduzir_movimento || !preferencias.animacoes
    document.documentElement.dataset.reduzirMovimento = reduzir ? 'true' : 'false'
  }, [preferencias.reduzir_movimento, preferencias.animacoes])

  return (
    <div className="flex min-h-dvh bg-app">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-15 items-center border-b border-line/40 bg-app/90 px-5 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
          <Logo className="text-[13px]" />
        </header>
        <main className="flex-1 px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-10 lg:py-10 xl:px-14">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
