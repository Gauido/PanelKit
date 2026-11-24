import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@panelkit/blocks'
import { Icon, pageIcons } from '../lib/icon'
import { Field, IconButton, Section, Select, TextInput } from '../lib/ui'
import { useCurrentPage, useEditor } from '../store'

export function Pages() {
  const { project, pageId, selectPage, addPage, removePage, update } = useEditor()
  const page = useCurrentPage()
  return (
    <div>
      <Section title="Páginas" action={<IconButton onClick={addPage} aria-label="Agregar página"><Plus className="size-4" /></IconButton>}>
        <div className="grid gap-1">
          {project.pages.map((p) => (
            <div key={p.id} className={cn('group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]', p.id === pageId ? 'bg-muted font-medium' : 'hover:bg-muted/60')}>
              <button className="flex flex-1 items-center gap-2 text-left" onClick={() => selectPage(p.id)}>
                <Icon name={p.icon} className="size-4 text-muted-foreground" />
                {p.title}
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">{p.path}</span>
              </button>
              {project.pages.length > 1 && (
                <IconButton className="opacity-0 group-hover:opacity-100" onClick={() => removePage(p.id)} aria-label="Eliminar página">
                  <Trash2 className="size-3.5" />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      </Section>
      <Section title="Página actual">
        <Field label="Título">
          <TextInput value={page.title} onChange={(e) => update((d) => void (d.pages.find((x) => x.id === page.id)!.title = e.target.value))} />
        </Field>
        <Field label="Ruta" hint="Empieza con /">
          <TextInput
            value={page.path}
            onChange={(e) => {
              const v = e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}`
              update((d) => void (d.pages.find((x) => x.id === page.id)!.path = v.replace(/\s+/g, '-')))
            }}
          />
        </Field>
        <Field label="Ícono en el menú">
          <Select
            value={page.icon}
            options={pageIcons.map((i) => ({ value: i, label: i }))}
            onChange={(e) => update((d) => void (d.pages.find((x) => x.id === page.id)!.icon = e.target.value))}
          />
        </Field>
      </Section>
    </div>
  )
}
