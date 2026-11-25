import { Code, Briefcase, CalendarDays, FormInput, Gauge, Heading, LayoutDashboard, MousePointerClick, Settings, Table, Users, BarChart3, History, LayoutGrid, SquareDashed, PanelTop, AppWindow, ListFilter, Type, Image, Minus, MoveVertical, Columns3, Repeat, type LucideIcon } from 'lucide-react'

const icons: Record<string, LucideIcon> = { Code, Briefcase, CalendarDays, FormInput, Gauge, Heading, LayoutDashboard, MousePointerClick, Settings, Table, Users, BarChart3, History, LayoutGrid, SquareDashed, PanelTop, AppWindow, ListFilter, Type, Image, Minus, MoveVertical, Columns3, Repeat }

export const pageIcons = ['LayoutDashboard', 'LayoutGrid', 'Users', 'Briefcase', 'BarChart3', 'CalendarDays', 'Settings']

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = icons[name] ?? LayoutDashboard
  return <C className={className} />
}
