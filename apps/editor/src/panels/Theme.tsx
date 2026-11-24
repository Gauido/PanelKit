import { cn } from '@panelkit/blocks'
import { Field, Section, Select, TextInput } from '../lib/ui'
import { useEditor } from '../store'

const accents = [
  { id: 'violet', color: 'oklch(0.56 0.22 285)' },
  { id: 'blue', color: 'oklch(0.58 0.2 255)' },
  { id: 'emerald', color: 'oklch(0.6 0.15 160)' },
  { id: 'rose', color: 'oklch(0.6 0.21 15)' },
  { id: 'amber', color: 'oklch(0.7 0.16 65)' },
]

export function Theme() {
  const { project, update } = useEditor()
  const t = project.theme
  return (
    <div>
      <Section title="Proyecto">
        <Field label="Nombre">
          <TextInput value={project.name} onChange={(e) => update((d) => void (d.name = e.target.value))} />
        </Field>
      </Section>
      <Section title="Estilo">
        <Field label="Color principal">
          <div className="flex gap-2">
            {accents.map((a) => (
              <button
                key={a.id}
                aria-label={a.id}
                onClick={() => update((d) => void (d.theme.accent = a.id))}
                className={cn('size-7 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110', t.accent === a.id && 'ring-2 ring-foreground')}
                style={{ background: a.color }}
              />
            ))}
          </div>
        </Field>
        <Field label={`Bordes redondeados: ${t.radius}px`}>
          <input type="range" min={0} max={24} value={t.radius} onChange={(e) => update((d) => void (d.theme.radius = Number(e.target.value)))} className="accent-[var(--color-primary)]" />
        </Field>
        <Field label="Modo">
          <Select
            value={t.mode}
            onChange={(e) => update((d) => void (d.theme.mode = e.target.value as typeof t.mode))}
            options={[
              { value: 'system', label: 'Según el sistema' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
          />
        </Field>
      </Section>
    </div>
  )
}
