import {
  LayoutDashboard, Dumbbell, ListChecks, Apple, Flame,
  TrendingUp, User, type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** aparece na barra inferior do celular */
  mobile?: { label: string; order: number }
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, mobile: { label: 'Início', order: 1 } },
  { to: '/treinos', label: 'Treinos', icon: Dumbbell, mobile: { label: 'Treinos', order: 2 } },
  { to: '/exercicios', label: 'Exercícios', icon: ListChecks, mobile: { label: 'Exercícios', order: 3 } },
  { to: '/nutricao', label: 'Nutrição', icon: Apple, mobile: { label: 'Nutrição', order: 4 } },
  { to: '/desafio', label: 'Desafio 24 Dias', icon: Flame },
  { to: '/evolucao', label: 'Evolução', icon: TrendingUp },
  { to: '/perfil', label: 'Perfil', icon: User, mobile: { label: 'Perfil', order: 5 } },
]

export const MOBILE_NAV = NAV
  .filter((i) => i.mobile)
  .sort((a, b) => a.mobile!.order - b.mobile!.order)
