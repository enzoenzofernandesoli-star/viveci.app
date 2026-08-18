import { NavLink } from 'react-router-dom'
import { NAV } from '../lib/nav'
import { Logo } from './Logo'
import { Divider, Surface } from './ui/Surface'
import { Eyebrow, MetaText } from './ui/Typography'

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line/50 bg-sidebar lg:flex">
      <div className="flex h-24 items-center px-8">
        <Logo className="text-[15px]" />
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1 overflow-y-auto px-5 py-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `relative flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[13px] font-medium ${isActive ? 'bg-card-hover text-brand' : 'text-ink-2 hover:bg-card/70 hover:text-ink'}`}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-brand" aria-hidden="true" />}
                <Icon size={18} strokeWidth={1.65} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-4 p-5">
        <Surface className="p-4">
          <Eyebrow>VIVECI Pro</Eyebrow>
          <MetaText className="mt-2">Recursos avançados serão liberados conforme o produto evoluir.</MetaText>
          <NavLink to="/planos" className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius-action)] border border-line text-xs font-semibold text-ink hover:border-ink-3 hover:bg-card-hover">
            Ver planos
          </NavLink>
        </Surface>

        <Divider />

        <NavLink to="/perfil" className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] px-2 text-ink-2 hover:bg-card hover:text-ink">
          <div className="size-9 shrink-0 rounded-full border border-line bg-card-hover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">Seu perfil</p>
            <p className="mt-0.5 text-[10px] text-ink-3">Dados e evolução</p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
