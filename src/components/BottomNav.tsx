import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NAV } from '../lib/nav'

function ItemNav({ item }: { item: (typeof NAV)[number] }) {
  const { to, label, icon: Icon } = item
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[9px] font-medium tracking-[-0.01em] ${isActive ? 'text-brand' : 'text-ink-3 hover:text-ink-2'}`}
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-0 h-px w-5 bg-brand" aria-hidden="true" />}
          <Icon size={19} strokeWidth={1.65} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  const [inicio, treino, social, nutricao, perfil] = NAV

  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-20 border-t border-line/50 bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-[520px] items-stretch px-1">
        {[inicio, treino, social].map((item) => <ItemNav key={item.to} item={item} />)}

        <NavLink
          to="/treino/rapido"
          aria-label="Iniciar treino rápido"
          className="group flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[9px] font-medium text-ink-3"
        >
          <span className="flex size-11 items-center justify-center rounded-[var(--radius-action)] bg-brand text-white group-hover:bg-brand-hover">
            <Plus size={21} strokeWidth={1.8} />
          </span>
          <span>Rápido</span>
        </NavLink>

        {[nutricao, perfil].map((item) => <ItemNav key={item.to} item={item} />)}
      </div>
    </nav>
  )
}
