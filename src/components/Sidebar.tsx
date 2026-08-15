import { NavLink } from 'react-router-dom'
import { NAV } from '../lib/nav'
import { Logo } from './Logo'

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar border-r border-line">
      <div className="px-6 h-20 flex items-center">
        <Logo className="text-2xl" />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-brand text-white font-semibold'
                  : 'text-ink-2 hover:bg-card-hover hover:text-ink'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 space-y-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-2">
            Plano Premium
          </p>
          <p className="mt-2 text-[13px] leading-snug text-ink-2">
            Aproveite todos os recursos e acelere seus resultados
          </p>
          <button className="mt-3 h-10 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
            Ver planos
          </button>
        </div>

        <NavLink
          to="/perfil"
          className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 transition-colors hover:bg-card-hover"
        >
          <div className="size-10 shrink-0 rounded-full border-2 border-line bg-card-hover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Convidado</p>
            <p className="text-xs text-ink-2">Ver perfil</p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
