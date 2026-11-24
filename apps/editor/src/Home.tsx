import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, CalendarDays, Copy, LayoutDashboard, Plus, Sparkles, Trash2, Users, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from '@panelkit/blocks'
import { accentColors, fonts, themePresets } from '@panelkit/exporter'
import { templates } from '@panelkit/schema'
import { useEditor, type ProjectMeta } from './store'

const templateIcons: Record<string, LucideIcon> = { Users, CalendarDays, LayoutDashboard }

function colorOf(primary: string) {
  return accentColors[primary] ?? primary
}

function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'recién'
  if (m < 60) return `hace ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

/** A tiny abstract dashboard drawn in the project's own color and font. */
function Thumb({ color, font, dark }: { color: string; font?: string; dark?: boolean }) {
  return (
    <div className={cn('relative flex h-32 overflow-hidden rounded-xl border border-border', dark ? 'bg-[oklch(0.18_0.01_270)]' : 'bg-muted/60')} style={{ fontFamily: font ? `'${fonts[font as keyof typeof fonts]?.family}'` : undefined }}>
      <div className={cn('w-10 border-r border-border p-2', dark ? 'bg-white/5' : 'bg-card/70')}>
        <div className="size-4 rounded-md" style={{ background: color }} />
        <div className="mt-3 grid gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('h-1.5 rounded-full', dark ? 'bg-white/15' : 'bg-foreground/10')} />
          ))}
        </div>
      </div>
      <div className="flex-1 p-2.5">
        <div className={cn('h-2 w-16 rounded-full', dark ? 'bg-white/30' : 'bg-foreground/25')} />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn('h-8 rounded-md border border-border p-1', dark ? 'bg-white/5' : 'bg-card')}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
            >
              <div className="h-1 w-6 rounded-full" style={{ background: color, opacity: 0.35 }} />
              <div className={cn('mt-1.5 h-2 w-8 rounded-full', dark ? 'bg-white/40' : 'bg-foreground/40')} />
            </motion.div>
          ))}
        </div>
        <div className={cn('mt-1.5 flex h-10 items-end gap-1 rounded-md border border-border p-1.5', dark ? 'bg-white/5' : 'bg-card')}>
          {[40, 70, 55, 90, 65, 80, 50].map((h, i) => (
            <motion.div key={i} className="flex-1 rounded-sm" style={{ background: color, opacity: 0.25 + i * 0.1 }} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.25 + i * 0.04, type: 'spring', stiffness: 200, damping: 18 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ meta, index }: { meta: ProjectMeta; index: number }) {
  const { openProject, deleteProject, duplicateProject } = useEditor()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-xl"
      onClick={() => openProject(meta.id)}
    >
      <Thumb color={colorOf(meta.primary)} font={meta.font} />
      <div className="mt-3 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="truncate font-medium">{meta.name}</p>
          <p className="text-xs text-muted-foreground">
            {meta.pages} {meta.pages === 1 ? 'página' : 'páginas'} · {meta.blocks} bloques · {ago(meta.updatedAt)}
          </p>
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="rounded-md p-1.5 hover:bg-muted" title="Duplicar" onClick={(e) => { e.stopPropagation(); duplicateProject(meta.id) }}>
            <Copy className="size-3.5" />
          </button>
          <button
            className="rounded-md p-1.5 text-rose-600 hover:bg-rose-500/10"
            title="Eliminar"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`¿Eliminar "${meta.name}"? No se puede deshacer.`)) deleteProject(meta.id)
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function NewProjectWizard({ onClose }: { onClose: () => void }) {
  const { createProject, openProject } = useEditor()
  const [step, setStep] = useState(0)
  const [template, setTemplate] = useState(templates[0]!.id)
  const [name, setName] = useState('')
  const chosen = templates.find((t) => t.id === template)!
  const [preset, setPreset] = useState(chosen.project.theme.preset)
  const p = themePresets.find((x) => x.id === preset) ?? themePresets[0]!

  function create() {
    const id = createProject({ template, name: name || chosen.name, theme: { ...p.theme, preset: p.id } })
    openProject(id)
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        layoutId="new-project"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-medium text-primary">Paso {step + 1} de 2</p>
            <h2 className="text-lg font-semibold tracking-tight">{step === 0 ? '¿Qué querés construir?' : 'Ponele nombre y estilo'}</h2>
          </div>
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <motion.span key={i} className="h-1.5 rounded-full bg-primary" animate={{ width: step === i ? 24 : 8, opacity: step === i ? 1 : 0.3 }} />
            ))}
          </div>
        </div>
        <div className="relative min-h-[360px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <motion.div key="s0" className="grid gap-3 p-6 sm:grid-cols-3" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25 }}>
                {templates.map((t, i) => {
                  const Icon = templateIcons[t.icon] ?? LayoutDashboard
                  const active = t.id === template
                  const tp = themePresets.find((x) => x.id === t.project.theme.preset) ?? themePresets[0]!
                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.06 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setTemplate(t.id)
                        setPreset(t.project.theme.preset)
                      }}
                      onDoubleClick={() => setStep(1)}
                      className={cn('relative rounded-2xl border-2 p-3 text-left transition-colors', active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
                    >
                      <Thumb color={tp.swatch[2]} font={tp.theme.font} dark={tp.theme.mode === 'dark'} />
                      <div className="mt-3 flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
                        <span className="font-medium">{t.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                      {active && <motion.span layoutId="tpl-check" className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground shadow">✓</motion.span>}
                    </motion.button>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div key="s1" className="grid gap-6 p-6 sm:grid-cols-[1fr_260px]" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="grid content-start gap-5">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium">Nombre del proyecto</span>
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && create()}
                      placeholder={chosen.name}
                      className="h-11 rounded-xl border border-border bg-background px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium">Estilo</span>
                    <div className="grid grid-cols-3 gap-2">
                      {themePresets.map((t) => (
                        <motion.button
                          key={t.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setPreset(t.id)}
                          className={cn('rounded-xl border-2 p-2 text-left transition-colors', preset === t.id ? 'border-primary' : 'border-border hover:border-primary/40')}
                        >
                          <div className="flex h-8 overflow-hidden rounded-md">
                            {t.swatch.map((c, i) => (
                              <span key={i} className="flex-1" style={{ background: c }} />
                            ))}
                          </div>
                          <p className="mt-1.5 text-xs font-medium" style={{ fontFamily: `'${fonts[t.theme.font].family}'` }}>{t.name}</p>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}. Lo podés cambiar cuando quieras.</p>
                  </div>
                </div>
                <motion.div key={preset} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="grid content-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Vista previa</span>
                  <Thumb color={p.swatch[2]} font={p.theme.font} dark={p.theme.mode === 'dark'} />
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: `'${fonts[p.theme.font].family}'` }}>
                    {p.theme.font} · bordes {p.theme.radius}px · animación {p.theme.motion === 'playful' ? 'con rebote' : p.theme.motion === 'subtle' ? 'sutil' : 'normal'}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep(0)}>
            {step === 0 ? 'Cancelar' : <><ArrowLeft className="size-4" /> Atrás</>}
          </Button>
          {step === 0 ? (
            <Button onClick={() => setStep(1)}>Siguiente <ArrowRight className="size-4" /></Button>
          ) : (
            <Button onClick={create}><Sparkles className="size-4" /> Crear proyecto</Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Home() {
  const projects = useEditor((s) => s.projects)
  const [wizard, setWizard] = useState(false)
  return (
    <div className="editor-dots min-h-dvh">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 font-bold text-primary-foreground shadow-md">P</span>
          <span className="text-lg font-semibold tracking-tight">PanelKit</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">alpha</span>
          <a href="https://github.com/Gauido/PanelKit" target="_blank" rel="noreferrer" className="ml-auto text-sm text-muted-foreground hover:text-foreground">GitHub</a>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-14 max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Armá tu sistema{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">arrastrando bloques</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">CRMs, turnos, paneles internos. Sin programar, y al final te llevás el código.</p>
        </motion.div>
        <div className="mt-12 flex items-center justify-between">
          <h2 className="font-semibold">{projects.length ? 'Tus proyectos' : 'Empezá tu primer proyecto'}</h2>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <motion.button
            layoutId="new-project"
            onClick={() => setWizard(true)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group grid min-h-[196px] place-items-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            <div>
              <motion.span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg" whileHover={{ rotate: 90 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Plus className="size-6" />
              </motion.span>
              <p className="mt-3 font-medium">Nuevo proyecto</p>
              <p className="text-xs text-muted-foreground">Elegí una plantilla y un estilo</p>
            </div>
          </motion.button>
          <AnimatePresence>
            {projects.map((m, i) => (
              <ProjectCard key={m.id} meta={m} index={i + 1} />
            ))}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>{wizard && <NewProjectWizard onClose={() => setWizard(false)} />}</AnimatePresence>
    </div>
  )
}
