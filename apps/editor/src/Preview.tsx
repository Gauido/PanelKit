import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { AppShell, Reveal } from '@panelkit/blocks'
import { spanClass, styleClass } from '@panelkit/exporter'
import type { Page } from '@panelkit/schema'
import { BlockView } from './lib/render'
import { useCurrentPage, useEditor } from './store'

function PreviewPage({ page }: { page: Page }) {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {page.children.map((n, i) => (
        <Reveal key={n.id} index={i} className={`${spanClass(n.layout.span)} ${styleClass(n.style)}`}>
          <BlockView node={n} live onNavigate={(to) => navigate(to)} />
        </Reveal>
      ))}
    </div>
  )
}

/** The app exactly as the exported repo will run it. */
export function Preview() {
  const project = useEditor((s) => s.project)
  const current = useCurrentPage()
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <MemoryRouter initialEntries={[current.path]}>
        <Routes>
          <Route element={<AppShell name={project.name} nav={project.pages.map((p) => ({ path: p.path, title: p.title, icon: p.icon }))} mode={project.theme.mode} />}>
            {project.pages.map((p) => (
              <Route key={p.id} path={p.path} element={<PreviewPage page={p} />} />
            ))}
          </Route>
        </Routes>
      </MemoryRouter>
    </div>
  )
}
