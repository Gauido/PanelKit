import { Code, Briefcase, CalendarDays, FormInput, Gauge, Heading, LayoutDashboard, MousePointerClick, Settings, Table, Users, BarChart3, History, LayoutGrid, type LucideIcon } from 'lucide-react'

const icons: Record<string, LucideIcon> = { Code, Briefcase, CalendarDays, FormInput, Gauge, Heading, LayoutDashboard, MousePointerClick, Settings, Table, Users, BarChart3, History, LayoutGrid }

export const pageIcons = ['LayoutDashboard', 'LayoutGrid', 'Users', 'Briefcase', 'BarChart3', 'CalendarDays', 'Settings']

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = icons[name] ?? LayoutDashboard
  return <C className={className} />
}
