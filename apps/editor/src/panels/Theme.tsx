import { AnimatePresence, motion } from 'motion/react'
import { Check, Loader2, Package, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn, toast } from '@panelkit/blocks'
import { accentColors, fonts, packageCatalog, themePresets } from '@panelkit/exporter'
import { FONTS, type Dependency, type Theme as ThemeT } from '@panelkit/schema'
import { Field, IconButton, Section, Select, TextInput, fieldClass } from '../lib/ui'
import { useEditor } from '../store'

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5 text-[12px]">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('relative flex-1 rounded-md px-2 py-1', value === o.value ? 'text-foreground' : 'text-muted-foreground')}>
          {value === o.value && <motion.span layoutId={`seg-${options.map((x) => x.value).join()}`} className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

function toHex(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color
  if (typeof document === 'undefined') return '#7c3aed'
  const c = document.createElement('canvas').getContext('2d')
  if (!c) return '#7c3aed'
  c.fillStyle = color
  return /^#[0-9a-f]{6}$/i.test(c.fillStyle) ? c.fillStyle : '#7c3aed'
}

type NpmHit = { name: string; version: string; description?: string }

function PackageSearch({ onAdd }: { onAdd: (dep: Dependency) => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<NpmHit[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (q.trim().length < 2) return setHits([])
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=6`, { signal: ctrl.signal })
        const json = (await res.json()) as { objects: { package: NpmHit }[] }
        setHits(json.objects.map((o) => o.package))
      } catch {
        /* offline or aborted */
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [q])
  return (
    <div className="grid gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <TextInput className="pl-8" placeholder="Buscar en npm…" value={q} onChange={(e) => setQ(e.target.value)} />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      <AnimatePresence>
        {hits.map((h, i) => (
          <motion.button
            key={h.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
            exit={{ opacity: 0 }}
            onClick={() => {
              const css = prompt(`¿Tiene un archivo CSS para importar? Escribí la ruta dentro del paquete (ej: dist/style.css) o dejalo vacío.`)?.trim()
              onAdd({ name: h.name, version: `^${h.version}`, kind: css ? 'css' : 'js', css: css || undefined })
              setQ('')
            }}
            className="rounded-lg border border-border p-2 text-left text-[12px] hover:border-primary/40 hover:bg-muted/50"
          >
            <span className="font-medium">{h.name}</span> <span className="text-muted-foreground">{h.version}</span>
            {h.description && <span className="block truncate text-[11px] text-muted-foreground">{h.description}</span>}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Theme() {
  const { project, update } = useEditor()
  const t = project.theme
  const setTheme = (p: Partial<ThemeT>) => update((d) => void (d.theme = { ...d.theme, ...p, preset: p.preset ?? 'custom' }))
  const primary = t.primary ?? accentColors[t.accent] ?? accentColors.violet!
  const installed = new Set(project.dependencies.map((d) => d.name))
  const addDep = (dep: Dependency) => {
    if (installed.has(dep.name)) return
    update((d) => void d.dependencies.push(dep))
    toast(`${dep.name} agregado al proyecto`)
  }
  const [css, setCss] = useState(project.customCss)
  useEffect(() => setCss(project.customCss), [project.customCss])

  return (
    <div>
      <Section title="Proyecto">
        <Field label="Nombre">
          <TextInput value={project.name} onChange={(e) => update((d) => void (d.name = e.target.value))} />
        </Field>
      </Section>

      <Section title="Estilos listos">
        <div className="grid grid-cols-2 gap-2">
          {themePresets.map((p) => (
            <motion.button
              key={p.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTheme({ ...p.theme, primary: p.theme.primary, preset: p.id })}
              className={cn('relative rounded-xl border-2 p-2 text-left transition-colors', t.preset === p.id ? 'border-primary' : 'border-border hover:border-primary/40')}
            >
              <div className="flex h-7 overflow-hidden rounded-md">
                {p.swatch.map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-1 text-[12px] font-medium" style={{ fontFamily: `'${fonts[p.theme.font].family}'` }}>{p.name}</p>
              {t.preset === p.id && (
                <motion.span layoutId="preset-check" className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="size-3" />
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </Section>

      <Section title="Personalizar">
        <Field label="Color principal">
          <div className="flex items-center gap-2">
            {Object.entries(accentColors).map(([id, c]) => (
              <button key={id} aria-label={id} onClick={() => setTheme({ accent: id, primary: undefined })} className={cn('size-6 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110', !t.primary && t.accent === id && 'ring-2 ring-foreground')} style={{ background: c }} />
            ))}
            <label className={cn('relative size-6 cursor-pointer overflow-hidden rounded-full ring-offset-2 ring-offset-background', t.primary && 'ring-2 ring-foreground')} title="Elegir cualquier color" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
              <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={toHex(primary)} onChange={(e) => setTheme({ primary: e.target.value })} />
            </label>
          </div>
        </Field>
        <Field label="Tipografía">
          <Select value={t.font} onChange={(e) => setTheme({ font: e.target.value as ThemeT['font'] })} options={FONTS.map((f) => ({ value: f, label: f }))} style={{ fontFamily: `'${fonts[t.font].family}'` }} />
        </Field>
        <Field label={`Bordes redondeados: ${t.radius}px`}>
          <input type="range" min={0} max={28} value={t.radius} onChange={(e) => setTheme({ radius: Number(e.target.value) })} className="accent-[var(--color-primary)]" />
        </Field>
        <Field label="Fondo">
          <Segmented value={t.surface} onChange={(v) => setTheme({ surface: v })} options={[{ value: 'cool', label: 'Frío' }, { value: 'neutral', label: 'Neutro' }, { value: 'warm', label: 'Cálido' }]} />
        </Field>
        <Field label="Modo">
          <Segmented value={t.mode} onChange={(v) => setTheme({ mode: v })} options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]} />
        </Field>
        <Field label="Animaciones" hint="Cómo entran los bloques, los números y las páginas.">
          <Segmented value={t.motion} onChange={(v) => setTheme({ motion: v })} options={[{ value: 'none', label: 'No' }, { value: 'subtle', label: 'Sutil' }, { value: 'normal', label: 'Normal' }, { value: 'playful', label: 'Rebote' }]} />
        </Field>
      </Section>

      <Section title="Frameworks y paquetes">
        <p className="text-[11px] text-muted-foreground">Se instalan en el repo exportado. Los de CSS se ven también acá mientras diseñás.</p>
        <div className="grid gap-1.5">
          {packageCatalog.map((p) => {
            const on = installed.has(p.name)
            return (
              <button
                key={p.name}
                disabled={on}
                onClick={() => addDep({ name: p.name, version: p.version, kind: p.kind, css: p.css })}
                title={p.note}
                className={cn('flex items-center gap-2 rounded-lg border p-2 text-left text-[12px] transition-colors', on ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40')}
              >
                <Package className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{p.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{p.description}</span>
                </span>
                {on ? <Check className="size-3.5 text-primary" /> : <span className="text-[11px] text-primary">Agregar</span>}
              </button>
            )
          })}
        </div>
        <PackageSearch onAdd={addDep} />
        {project.dependencies.length > 0 && (
          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Instalados</span>
            {project.dependencies.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-[12px]">
                <span className="flex-1 truncate font-mono">{d.name}</span>
                <input className="w-16 rounded border border-border bg-background px-1 text-[11px]" value={d.version} onChange={(e) => update((x) => void (x.dependencies[i]!.version = e.target.value))} aria-label="Versión" />
                <span className="rounded bg-card px-1 text-[10px] text-muted-foreground">{d.kind === 'tailwind-plugin' ? 'plugin' : d.kind}</span>
                <IconButton onClick={() => update((x) => void x.dependencies.splice(i, 1))} aria-label="Quitar"><Trash2 className="size-3" /></IconButton>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="CSS propio">
        <p className="text-[11px] text-muted-foreground">Se aplica a todo el proyecto, después de todos los estilos. Podés usar las variables del tema, como <code className="rounded bg-muted px-1">var(--primary)</code>.</p>
        <textarea
          value={css}
          onChange={(e) => setCss(e.target.value)}
          onBlur={() => css !== project.customCss && update((d) => void (d.customCss = css))}
          spellCheck={false}
          placeholder={'.pk-html h2 {\n  letter-spacing: -0.02em;\n}'}
          className={cn(fieldClass, 'h-40 py-2 font-mono text-[11px] leading-relaxed')}
        />
      </Section>
    </div>
  )
}
