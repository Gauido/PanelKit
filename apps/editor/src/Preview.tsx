import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { AppShell, LoginScreen, Reveal, cn, hasRole, login, logout, setSessionKey, useSession, whenText } from '@panelkit/blocks'
import { ShieldOff } from 'lucide-react'
import { apiFor } from './lib/actions'
import { layoutClass, registry, styleClass, styleCss } from '@panelkit/exporter'
import type { Page } from '@panelkit/schema'
import { BlockView } from './lib/render'
import { PageStateProvider, usePage } from './lib/page-state'
import { DeviceFrame } from './lib/device-frame'
import { useCurrentPage, useEditor } from './store'

function PageBody({ page }: { page: Page }) {
  const navigate = useNavigate()
  const { state } = usePage()
  const session = useSession()
  const auth = useEditor((s) => s.project.auth)
  return (
    <div className="@container grid grid-cols-12 gap-4 @3xl:gap-6">
      {page.children.map((n, i) =>
        registry[n.type]?.container === 'overlay' ? (
          <BlockView key={n.id} node={n} live onNavigate={(to) => navigate(to)} />
        ) : whenText(n.visibleIf, { state, user: session?.user }) && (!auth.enabled || hasRole(session, n.roles, auth.roleField)) ? (
          <Reveal key={n.id} index={i} className={`${layoutClass(n.layout)} ${styleClass(n.style)}`} style={styleCss(n.style)}>
            <BlockView node={n} live onNavigate={(to) => navigate(to)} />
          </Reveal>
        ) : null,
      )}
    </div>
  )
}

function PreviewPage({ page }: { page: Page }) {
  const session = useSession()
  const auth = useEditor((s) => s.project.auth)
  if (auth.enabled && !hasRole(session, page.roles, auth.roleField)) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <ShieldOff className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No tenés permiso para ver esta página</p>
          <p className="mt-1 text-sm text-muted-foreground">Pedile acceso a quien administra el sistema.</p>
        </div>
      </div>
    )
  }
  return (
    <PageStateProvider initial={page.state ?? {}}>
      <PageBody page={page} />
    </PageStateProvider>
  )
}

/** The app exactly as the exported repo will run it. */
export function Preview() {
  const project = useEditor((s) => s.project)
  const current = useCurrentPage()
  const device = useEditor((s) => s.device)
  const projectId = useEditor((s) => s.projectId)
  const env = useEditor((s) => s.env)
  // Each project keeps its own test session while you try it here.
  setSessionKey(`editor:${projectId ?? 'demo'}`)
  const session = useSession()
  const auth = project.auth
  const source = project.dataSources.find((d) => d.id === auth.source)
  const demoUser = source?.type === 'static' ? source.tables.users?.[0] : undefined
  const user = session?.user
  const shellUser = user ? { name: String(user.name ?? ''), email: String(user.email ?? ''), role: String(user[auth.roleField] ?? '') } : null
  const nav = project.pages.filter((p) => !auth.enabled || hasRole(session, p.roles, auth.roleField)).map((p) => ({ path: p.path, title: p.title, icon: p.icon }))

  if (auth.enabled && !session) {
    return (
      <div className={cn('min-h-0 flex-1 overflow-auto', device !== 'desktop' && 'editor-dots p-6')}>
        <DeviceFrame device={device} className={device !== 'desktop' ? 'overflow-hidden' : 'border-0'}>
          <LoginScreen
            name={project.name}
            hint={demoUser ? `Para probar: ${String(demoUser.email)} / ${String(demoUser.password)}` : undefined}
            onLogin={async (email, password) => {
              const api = apiFor(project, auth.source, env)
              if (!api) throw new Error('Elegí de dónde sale el inicio de sesión, en Páginas → Acceso')
              await login(api, auth, email, password)
            }}
          />
        </DeviceFrame>
      </div>
    )
  }
  return (
    <div className={cn('min-h-0 flex-1 overflow-auto', device !== 'desktop' && 'editor-dots p-6')}>
      <DeviceFrame device={device} className={device !== 'desktop' ? 'overflow-hidden' : 'border-0'}>
      <MemoryRouter initialEntries={[current.path]}>
        <Routes>
          <Route element={<AppShell name={project.name} nav={nav} mode={project.theme.mode} user={auth.enabled ? shellUser : null} onLogout={logout} />}>
            {project.pages.map((p) => (
              <Route key={p.id} path={p.path} element={<PreviewPage page={p} />} />
            ))}
          </Route>
        </Routes>
      </MemoryRouter>
      </DeviceFrame>
    </div>
  )
}
