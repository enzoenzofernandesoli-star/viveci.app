import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NAV } from '../lib/nav'

export function BottomNav() {
  const [inicio, treino, nutricao, perfil] = NAV

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden">
      {[inicio, treino].map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              isActive ? 'text-brand font-semibold' : 'text-ink-3'
            }`
          }
        >
          <Icon size={20} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}

      <div className="flex flex-1 justify-center">
        <NavLink to="/treino/rapido" className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-colors hover:bg-brand-hover">
          <Plus size={26} strokeWidth={2} />
        </NavLink>
      </div>

      {[nutricao, perfil].map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              isActive ? 'text-brand font-semibold' : 'text-ink-3'
            }`
          }
        >
          <Icon size={20} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
