import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { AppShell, Reveal, cn } from '@panelkit/blocks'
import { layoutClass, registry, styleClass } from '@panelkit/exporter'
import type { Page } from '@panelkit/schema'
import { BlockView } from './lib/render'
import { PageStateProvider } from './lib/page-state'
import { DeviceFrame } from './lib/device-frame'
import { useCurrentPage, useEditor } from './store'

function PreviewPage({ page }: { page: Page }) {
  const navigate = useNavigate()
  return (
    <PageStateProvider initial={page.state ?? {}}>
      <div className="@container grid grid-cols-12 gap-4 @3xl:gap-6">
        {page.children.map((n, i) =>
          registry[n.type]?.container === 'overlay' ? (
            <BlockView key={n.id} node={n} live onNavigate={(to) => navigate(to)} />
          ) : (
            <Reveal key={n.id} index={i} className={`${layoutClass(n.layout)} ${styleClass(n.style)}`}>
              <BlockView node={n} live onNavigate={(to) => navigate(to)} />
            </Reveal>
          ),
        )}
      </div>
    </PageStateProvider>
  )
}

/** The app exactly as the exported repo will run it. */
export function Preview() {
  const project = useEditor((s) => s.project)
  const current = useCurrentPage()
  const device = useEditor((s) => s.device)
  return (
    <div className={cn('min-h-0 flex-1 overflow-auto', device !== 'desktop' && 'editor-dots p-6')}>
      <DeviceFrame device={device} className={device !== 'desktop' ? 'overflow-hidden' : 'border-0'}>
      <MemoryRouter initialEntries={[current.path]}>
        <Routes>
          <Route element={<AppShell name={project.name} nav={project.pages.map((p) => ({ path: p.path, title: p.title, icon: p.icon }))} mode={project.theme.mode} />}>
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
