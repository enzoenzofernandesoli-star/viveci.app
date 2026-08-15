import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Logo } from './Logo'

export function Layout() {
  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center px-4 lg:hidden">
          <Logo className="text-xl" />
        </header>
        <main className="flex-1 px-4 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
