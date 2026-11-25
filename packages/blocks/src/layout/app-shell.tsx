import { AnimatePresence, motion } from 'motion/react'
import { BarChart3, Briefcase, CalendarDays, LayoutDashboard, LayoutGrid, LogOut, Moon, Settings, Sun, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { cn } from '../lib/utils'

const icons: Record<string, LucideIcon> = { LayoutDashboard, LayoutGrid, Users, Briefcase, BarChart3, CalendarDays, Settings }

export type NavItem = { path: string; title: string; icon?: string }

export function useDarkMode(initial: 'light' | 'dark' | 'system' = 'system') {
  const [dark, setDark] = useState(() => {
    if (initial !== 'system') return initial === 'dark'
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return [dark, setDark] as const
}

export type ShellUser = { name?: string; email?: string; role?: string }

export function AppShell({ name, nav, mode = 'system', user, onLogout, children }: { name: string; nav: NavItem[]; mode?: 'light' | 'dark' | 'system'; user?: ShellUser | null; onLogout?: () => void; children?: ReactNode }) {
  const [dark, setDark] = useDarkMode(mode)
  const location = useLocation()

  return (
    <div className="@container/shell flex min-h-dvh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card/60 p-4 backdrop-blur @3xl/shell:flex">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid size-8 place-items-center rounded-[calc(var(--radius)-4px)] bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate font-semibold tracking-tight">{name}</span>
        </div>
        <nav className="mt-6 grid gap-1">
          {nav.map((item) => {
            const Icon = icons[item.icon ?? ''] ?? LayoutDashboard
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2.5 rounded-[calc(var(--radius)-4px)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="nav-active" className="absolute inset-0 rounded-[calc(var(--radius)-4px)] bg-muted" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                    <Icon className="relative size-4" />
                    <span className="relative">{item.title}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
        <button
          onClick={() => setDark(!dark)}
          className="mt-auto flex items-center gap-2 rounded-[calc(var(--radius)-4px)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>
        {user && (
          <div className="mt-2 flex items-center gap-2.5 border-t border-border px-2 pt-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name || user.email}</span>
              {user.role && <span className="block truncate text-[11px] text-muted-foreground">{user.role}</span>}
            </span>
            {onLogout && (
              <button onClick={onLogout} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Salir" title="Salir">
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b border-border p-2 @3xl/shell:hidden">
          {nav.map((item) => (
            <NavLink key={item.path} to={item.path} end className={({ isActive }) => cn('rounded-md px-3 py-1.5 text-sm whitespace-nowrap', isActive ? 'bg-muted font-medium' : 'text-muted-foreground')}>
              {item.title}
            </NavLink>
          ))}
          {user && onLogout && (
            <button onClick={onLogout} className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground" aria-label="Salir">
              <LogOut className="size-4" /> Salir
            </button>
          )}
        </nav>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-7xl p-4 @3xl/shell:p-8"
          >
            {children ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
