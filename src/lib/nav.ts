import { LayoutDashboard, Dumbbell, Users, Apple, User, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/treino', label: 'Treino', icon: Dumbbell },
  { to: '/social', label: 'Social', icon: Users },
  { to: '/nutricao', label: 'Nutrição', icon: Apple },
  { to: '/perfil', label: 'Perfil', icon: User },
]
