import type { Node, Project } from '@panelkit/schema'

/** How a prop is edited in the properties panel. */
export type PropField =
  | { key: string; label: string; kind: 'text' | 'number' | 'boolean' | 'textarea' }
  | { key: string; label: string; kind: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: 'query'; method?: 'GET' | 'WRITE' }
  | { key: string; label: string; kind: 'field'; queryKey: string }
  | { key: string; label: string; kind: 'columns'; queryKey: string }
  | { key: string; label: string; kind: 'formFields' }
  | { key: string; label: string; kind: 'code'; language: 'html' | 'css' }

export type ExportContext = {
  project: Project
  /** Variable that holds the result of a GET query on the current page. */
  queryVar: (queryId: string) => string
}

export type BlockDef = {
  type: string
  label: string
  description: string
  /** lucide-react icon name used in the palette. */
  icon: string
  category: 'Datos' | 'Formularios' | 'Contenido'
  defaultSpan: number
  defaultProps: Record<string, unknown>
  fields: PropField[]
  /** Prop keys that hold a GET query id (data is fetched on the page). */
  readQueries: string[]
  /** Events the block fires; each can run a list of actions. */
  events: { name: string; label: string; arg?: 'values' | 'row' }[]
  /** Component name and import path inside the exported repo. */
  component: { name: string; from: string }
  /** Props passed straight through to the component. */
  passProps: string[]
}

export const registry: Record<string, BlockDef> = {
  PageHeader: {
    type: 'PageHeader',
    label: 'Encabezado',
    description: 'Título y subtítulo de la página',
    icon: 'Heading',
    category: 'Contenido',
    defaultSpan: 12,
    defaultProps: { title: 'Nueva página', subtitle: 'Describí qué se gestiona acá' },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'subtitle', label: 'Subtítulo', kind: 'text' },
    ],
    readQueries: [],
    events: [],
    component: { name: 'PageHeader', from: '@/components/blocks/page-header' },
    passProps: ['title', 'subtitle'],
  },
  KpiCard: {
    type: 'KpiCard',
    label: 'KPI',
    description: 'Número clave con animación y tendencia',
    icon: 'Gauge',
    category: 'Datos',
    defaultSpan: 3,
    defaultProps: { title: 'Total', aggregate: 'count', icon: 'Users' },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'query', label: 'Datos', kind: 'query', method: 'GET' },
      {
        key: 'aggregate',
        label: 'Cálculo',
        kind: 'select',
        options: [
          { value: 'count', label: 'Contar filas' },
          { value: 'sum', label: 'Sumar campo' },
          { value: 'avg', label: 'Promedio del campo' },
          { value: 'static', label: 'Valor fijo' },
        ],
      },
      { key: 'field', label: 'Campo', kind: 'field', queryKey: 'query' },
      { key: 'value', label: 'Valor fijo', kind: 'number' },
      { key: 'prefix', label: 'Prefijo', kind: 'text' },
      { key: 'suffix', label: 'Sufijo', kind: 'text' },
      { key: 'delta', label: 'Variación %', kind: 'number' },
      {
        key: 'icon',
        label: 'Ícono',
        kind: 'select',
        options: ['Users', 'DollarSign', 'TrendingUp', 'Activity', 'ShoppingCart', 'Briefcase'].map((v) => ({ value: v, label: v })),
      },
    ],
    readQueries: ['query'],
    events: [],
    component: { name: 'KpiCard', from: '@/components/blocks/kpi-card' },
    passProps: ['title', 'aggregate', 'field', 'value', 'prefix', 'suffix', 'delta', 'icon'],
  },
  DataTable: {
    type: 'DataTable',
    label: 'Tabla',
    description: 'Listado con búsqueda, orden y paginación',
    icon: 'Table',
    category: 'Datos',
    defaultSpan: 12,
    defaultProps: { title: 'Listado', columns: [], pageSize: 8, searchable: true },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'query', label: 'Datos', kind: 'query', method: 'GET' },
      { key: 'columns', label: 'Columnas', kind: 'columns', queryKey: 'query' },
      { key: 'pageSize', label: 'Filas por página', kind: 'number' },
      { key: 'searchable', label: 'Búsqueda', kind: 'boolean' },
    ],
    readQueries: ['query'],
    events: [{ name: 'onRowClick', label: 'Al hacer clic en una fila', arg: 'row' }],
    component: { name: 'DataTable', from: '@/components/blocks/data-table' },
    passProps: ['title', 'columns', 'pageSize', 'searchable'],
  },
  EntityForm: {
    type: 'EntityForm',
    label: 'Formulario',
    description: 'Alta o edición que envía a tu API',
    icon: 'FormInput',
    category: 'Formularios',
    defaultSpan: 6,
    defaultProps: {
      title: 'Nuevo registro',
      submitLabel: 'Guardar',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
      ],
    },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'description', label: 'Descripción', kind: 'text' },
      { key: 'fields', label: 'Campos', kind: 'formFields' },
      { key: 'submitLabel', label: 'Texto del botón', kind: 'text' },
    ],
    readQueries: [],
    events: [{ name: 'onSubmit', label: 'Al enviar', arg: 'values' }],
    component: { name: 'EntityForm', from: '@/components/blocks/entity-form' },
    passProps: ['title', 'description', 'fields', 'submitLabel'],
  },
  ActionButton: {
    type: 'ActionButton',
    label: 'Botón',
    description: 'Dispara acciones: llamar a la API, navegar, avisar',
    icon: 'MousePointerClick',
    category: 'Contenido',
    defaultSpan: 3,
    defaultProps: { label: 'Nuevo', variant: 'primary' },
    fields: [
      { key: 'label', label: 'Texto', kind: 'text' },
      {
        key: 'variant',
        label: 'Variante',
        kind: 'select',
        options: [
          { value: 'primary', label: 'Principal' },
          { value: 'outline', label: 'Borde' },
          { value: 'ghost', label: 'Sutil' },
        ],
      },
      { key: 'fullWidth', label: 'Ancho completo', kind: 'boolean' },
    ],
    readQueries: [],
    events: [{ name: 'onClick', label: 'Al hacer clic' }],
    component: { name: 'ActionButton', from: '@/components/blocks/action-button' },
    passProps: ['label', 'variant', 'fullWidth'],
  },
  HtmlBlock: {
    type: 'HtmlBlock',
    label: 'HTML libre',
    description: 'Tu propio HTML con clases de Tailwind o del framework que instales',
    icon: 'Code',
    category: 'Contenido',
    defaultSpan: 12,
    defaultProps: {
      html: '<div class="rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-8 text-primary-foreground">\n  <h2 class="text-2xl font-semibold">Bloque libre</h2>\n  <p class="mt-2 opacity-90">Escribí HTML con las clases que quieras.</p>\n</div>',
    },
    fields: [{ key: 'html', label: 'HTML', kind: 'code', language: 'html' }],
    readQueries: [],
    events: [],
    component: { name: 'HtmlBlock', from: '@/components/blocks/html-block' },
    passProps: ['html'],
  },
}

export function blockFor(node: Node): BlockDef | undefined {
  return registry[node.type]
}
