import { NavLink } from 'react-router-dom'
import { NAV } from '../lib/nav'

function ItemNav({ item }: { item: (typeof NAV)[number] }) {
  const { to, label, icon: Icon } = item
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `relative flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[-0.02em] ${isActive ? 'text-brand' : 'text-ink-3 hover:text-ink-2'}`}
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-0 h-px w-5 bg-brand" aria-hidden="true" />}
          <Icon size={20} strokeWidth={1.65} />
          <span className="max-w-full truncate px-0.5">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-20 border-t border-line/50 bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-[520px] items-stretch px-1">
        {NAV.map((item) => <ItemNav key={item.to} item={item} />)}
      </div>
    </nav>
  )
}
