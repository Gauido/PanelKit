import { Briefcase, CalendarDays, FormInput, Gauge, Heading, LayoutDashboard, MousePointerClick, Settings, Table, Users, BarChart3, type LucideIcon } from 'lucide-react'

const icons: Record<string, LucideIcon> = { Briefcase, CalendarDays, FormInput, Gauge, Heading, LayoutDashboard, MousePointerClick, Settings, Table, Users, BarChart3 }

export const pageIcons = ['LayoutDashboard', 'Users', 'Briefcase', 'BarChart3', 'CalendarDays', 'Settings']

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = icons[name] ?? LayoutDashboard
  return <C className={className} />
}
