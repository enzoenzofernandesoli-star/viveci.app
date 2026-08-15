import { NavLink } from 'react-router-dom'
import { MOBILE_NAV } from '../lib/nav'

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden">
      {MOBILE_NAV.map(({ to, icon: Icon, mobile }) => (
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
          {mobile!.label}
        </NavLink>
      ))}
    </nav>
  )
}
