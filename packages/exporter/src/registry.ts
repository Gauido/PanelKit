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
  category: 'Datos' | 'Gráficos' | 'Agenda' | 'Formularios' | 'Contenedores' | 'Contenido'
  defaultSpan: number
  defaultProps: Record<string, unknown>
  fields: PropField[]
  /** Prop keys that hold a GET query id (data is fetched on the page). */
  readQueries: string[]
  /** Events the block fires; each can run a list of actions. */
  events: { name: string; label: string; arg?: 'values' | 'row' | 'slot' | 'day' | 'value' }[]
  /** Component name and import path inside the exported repo. */
  component: { name: string; from: string }
  /** Props passed straight through to the component. */
  passProps: string[]
  /** Holds other blocks: on a 12-column grid, one per tab, or in an overlay (modal / drawer). */
  container?: 'grid' | 'tabs' | 'overlay' | 'flex'
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
      { key: 'filterField', label: 'Filtro rápido por', kind: 'field', queryKey: 'query' },
    ],
    readQueries: ['query'],
    events: [
      { name: 'onRowClick', label: 'Al hacer clic en una fila', arg: 'row' },
      { name: 'onRowEdit', label: 'Botón editar de cada fila', arg: 'row' },
      { name: 'onRowDelete', label: 'Botón eliminar de cada fila', arg: 'row' },
    ],
    component: { name: 'DataTable', from: '@/components/blocks/data-table' },
    passProps: ['title', 'columns', 'pageSize', 'searchable', 'filterField'],
  },
  Chart: {
    type: 'Chart',
    label: 'Gráfico',
    description: 'Barras, líneas, área o torta animados',
    icon: 'BarChart3',
    category: 'Gráficos',
    defaultSpan: 6,
    defaultProps: { title: 'Gráfico', chartType: 'bar', aggregate: 'count', dateGroup: 'none', height: 240 },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'query', label: 'Datos', kind: 'query', method: 'GET' },
      {
        key: 'chartType',
        label: 'Tipo',
        kind: 'select',
        options: [
          { value: 'bar', label: 'Barras' },
          { value: 'line', label: 'Línea' },
          { value: 'area', label: 'Área' },
          { value: 'donut', label: 'Torta (dona)' },
        ],
      },
      { key: 'labelField', label: 'Agrupar por', kind: 'field', queryKey: 'query' },
      {
        key: 'dateGroup',
        label: 'Si es fecha, agrupar por',
        kind: 'select',
        options: [
          { value: 'none', label: 'No es fecha' },
          { value: 'day', label: 'Día' },
          { value: 'month', label: 'Mes' },
        ],
      },
      {
        key: 'aggregate',
        label: 'Cálculo',
        kind: 'select',
        options: [
          { value: 'count', label: 'Cantidad de filas' },
          { value: 'sum', label: 'Sumar campo' },
          { value: 'avg', label: 'Promedio del campo' },
        ],
      },
      { key: 'valueField', label: 'Campo numérico', kind: 'field', queryKey: 'query' },
      { key: 'height', label: 'Alto (px)', kind: 'number' },
    ],
    readQueries: ['query'],
    events: [],
    component: { name: 'Chart', from: '@/components/blocks/chart' },
    passProps: ['title', 'chartType', 'labelField', 'valueField', 'aggregate', 'dateGroup', 'height'],
  },
  Timeline: {
    type: 'Timeline',
    label: 'Actividad',
    description: 'Línea de tiempo con lo último que pasó',
    icon: 'History',
    category: 'Datos',
    defaultSpan: 4,
    defaultProps: { title: 'Actividad reciente', order: 'desc', limit: 6 },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'query', label: 'Datos', kind: 'query', method: 'GET' },
      { key: 'titleField', label: 'Texto principal', kind: 'field', queryKey: 'query' },
      { key: 'descriptionField', label: 'Detalle', kind: 'field', queryKey: 'query' },
      { key: 'dateField', label: 'Fecha', kind: 'field', queryKey: 'query' },
      { key: 'statusField', label: 'Estado', kind: 'field', queryKey: 'query' },
      {
        key: 'order',
        label: 'Orden',
        kind: 'select',
        options: [
          { value: 'desc', label: 'Más nuevo primero' },
          { value: 'asc', label: 'Más viejo primero' },
        ],
      },
      { key: 'limit', label: 'Máximo de ítems', kind: 'number' },
    ],
    readQueries: ['query'],
    events: [{ name: 'onItemClick', label: 'Al hacer clic en un ítem', arg: 'row' }],
    component: { name: 'Timeline', from: '@/components/blocks/timeline' },
    passProps: ['title', 'titleField', 'descriptionField', 'dateField', 'statusField', 'order', 'limit'],
  },
  Calendar: {
    type: 'Calendar',
    label: 'Calendario',
    description: 'Agenda semanal o mensual con tus eventos',
    icon: 'CalendarDays',
    category: 'Agenda',
    defaultSpan: 12,
    defaultProps: { title: 'Agenda', view: 'week' },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'query', label: 'Datos', kind: 'query', method: 'GET' },
      { key: 'dateField', label: 'Fecha', kind: 'field', queryKey: 'query' },
      { key: 'timeField', label: 'Hora (si está aparte)', kind: 'field', queryKey: 'query' },
      { key: 'titleField', label: 'Texto del evento', kind: 'field', queryKey: 'query' },
      { key: 'statusField', label: 'Estado (color)', kind: 'field', queryKey: 'query' },
      {
        key: 'view',
        label: 'Vista inicial',
        kind: 'select',
        options: [
          { value: 'week', label: 'Semana' },
          { value: 'month', label: 'Mes' },
        ],
      },
    ],
    readQueries: ['query'],
    events: [
      { name: 'onEventClick', label: 'Al hacer clic en un evento', arg: 'row' },
      { name: 'onDayClick', label: 'Al hacer clic en un día', arg: 'day' },
    ],
    component: { name: 'Calendar', from: '@/components/blocks/calendar' },
    passProps: ['title', 'dateField', 'timeField', 'titleField', 'statusField', 'view'],
  },
  AvailabilityGrid: {
    type: 'AvailabilityGrid',
    label: 'Grilla de turnos',
    description: 'Disponibilidad por recurso y horario: canchas, salas, profesionales',
    icon: 'LayoutGrid',
    category: 'Agenda',
    defaultSpan: 12,
    defaultProps: { title: 'Disponibilidad', resources: 'Recurso 1, Recurso 2', startTime: '08:00', endTime: '22:00', slotMinutes: 60 },
    fields: [
      { key: 'title', label: 'Título', kind: 'text' },
      { key: 'query', label: 'Reservas', kind: 'query', method: 'GET' },
      { key: 'resources', label: 'Recursos (separados por coma)', kind: 'text' },
      { key: 'resourceField', label: 'Campo del recurso', kind: 'field', queryKey: 'query' },
      { key: 'dateField', label: 'Fecha', kind: 'field', queryKey: 'query' },
      { key: 'timeField', label: 'Hora (si está aparte)', kind: 'field', queryKey: 'query' },
      { key: 'durationField', label: 'Duración en minutos', kind: 'field', queryKey: 'query' },
      { key: 'labelField', label: 'Texto de la reserva', kind: 'field', queryKey: 'query' },
      { key: 'statusField', label: 'Estado (color)', kind: 'field', queryKey: 'query' },
      { key: 'startTime', label: 'Abre a las', kind: 'text' },
      { key: 'endTime', label: 'Cierra a las', kind: 'text' },
      { key: 'slotMinutes', label: 'Minutos por turno', kind: 'number' },
    ],
    readQueries: ['query'],
    events: [
      { name: 'onSlotClick', label: 'Al tocar un turno libre', arg: 'slot' },
      { name: 'onBookingClick', label: 'Al tocar una reserva', arg: 'row' },
    ],
    component: { name: 'AvailabilityGrid', from: '@/components/blocks/availability-grid' },
    passProps: ['title', 'resources', 'resourceField', 'dateField', 'timeField', 'durationField', 'labelField', 'statusField', 'startTime', 'endTime', 'slotMinutes'],
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
      { key: 'initialValues', label: 'Valores iniciales (ej. {{state.seleccionado}})', kind: 'text' },
      { key: 'resetOnSubmit', label: 'Vaciar al guardar', kind: 'boolean' },
    ],
    readQueries: [],
    events: [{ name: 'onSubmit', label: 'Al enviar', arg: 'values' }],
    component: { name: 'EntityForm', from: '@/components/blocks/entity-form' },
    passProps: ['title', 'description', 'fields', 'submitLabel', 'initialValues', 'resetOnSubmit'],
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

registry.Section = {
  type: 'Section',
  label: 'Sección',
  description: 'Agrupa bloques en una tarjeta con su propia grilla',
  icon: 'SquareDashed',
  category: 'Contenedores',
  defaultSpan: 12,
  defaultProps: { title: 'Sección', card: true },
  fields: [
    { key: 'title', label: 'Título', kind: 'text' },
    { key: 'description', label: 'Descripción', kind: 'text' },
    { key: 'card', label: 'Con tarjeta', kind: 'boolean' },
  ],
  readQueries: [],
  events: [],
  component: { name: 'Section', from: '@/components/blocks/section' },
  passProps: ['title', 'description', 'card'],
  container: 'grid',
}

registry.Tabs = {
  type: 'Tabs',
  label: 'Pestañas',
  description: 'Cada bloque adentro es una pestaña (usá Secciones para varias cosas)',
  icon: 'PanelTop',
  category: 'Contenedores',
  defaultSpan: 12,
  defaultProps: { variant: 'underline' },
  fields: [
    {
      key: 'variant',
      label: 'Estilo',
      kind: 'select',
      options: [
        { value: 'underline', label: 'Subrayado' },
        { value: 'pills', label: 'Botones' },
      ],
    },
  ],
  readQueries: [],
  events: [],
  component: { name: 'Tabs', from: '@/components/blocks/tabs' },
  passProps: ['variant'],
  container: 'tabs',
}

registry.Modal = {
  type: 'Modal',
  label: 'Modal / panel',
  description: 'Ventana o panel lateral con cualquier bloque. Se abre con la acción “Abrir modal”',
  icon: 'AppWindow',
  category: 'Contenedores',
  defaultSpan: 12,
  defaultProps: { title: 'Detalle', kind: 'modal', size: 'md' },
  fields: [
    { key: 'title', label: 'Título', kind: 'text' },
    { key: 'description', label: 'Descripción', kind: 'text' },
    {
      key: 'kind',
      label: 'Tipo',
      kind: 'select',
      options: [
        { value: 'modal', label: 'Ventana al centro' },
        { value: 'drawer', label: 'Panel lateral' },
      ],
    },
    {
      key: 'size',
      label: 'Tamaño',
      kind: 'select',
      options: [
        { value: 'sm', label: 'Chico' },
        { value: 'md', label: 'Mediano' },
        { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'Muy grande' },
      ],
    },
  ],
  readQueries: [],
  events: [],
  component: { name: 'Modal', from: '@/components/blocks/modal' },
  passProps: ['title', 'description', 'kind', 'size'],
  container: 'overlay',
}

registry.Filter = {
  type: 'Filter',
  label: 'Filtro / selector',
  description: 'Lo que elige el usuario queda en una variable para filtrar otros bloques',
  icon: 'ListFilter',
  category: 'Formularios',
  defaultSpan: 3,
  defaultProps: { label: 'Filtrar', inputType: 'select', stateKey: 'filtro', allLabel: 'Todos', options: '' },
  fields: [
    { key: 'label', label: 'Etiqueta', kind: 'text' },
    { key: 'stateKey', label: 'Guardar en la variable', kind: 'text' },
    {
      key: 'inputType',
      label: 'Tipo',
      kind: 'select',
      options: [
        { value: 'select', label: 'Lista' },
        { value: 'text', label: 'Texto / búsqueda' },
        { value: 'date', label: 'Fecha' },
        { value: 'number', label: 'Número' },
      ],
    },
    { key: 'options', label: 'Opciones fijas (separadas por coma)', kind: 'text' },
    { key: 'optionsQuery', label: 'Opciones desde la API', kind: 'query', method: 'GET' },
    { key: 'optionLabel', label: 'Campo a mostrar', kind: 'field', queryKey: 'optionsQuery' },
    { key: 'optionValue', label: 'Campo a guardar', kind: 'field', queryKey: 'optionsQuery' },
    { key: 'allLabel', label: 'Opción “sin filtro”', kind: 'text' },
    { key: 'placeholder', label: 'Texto de ayuda', kind: 'text' },
  ],
  readQueries: ['optionsQuery'],
  events: [{ name: 'onChange', label: 'Al cambiar (además de guardar la variable)', arg: 'value' }],
  component: { name: 'Filter', from: '@/components/blocks/filter' },
  passProps: ['label', 'inputType', 'options', 'optionLabel', 'optionValue', 'allLabel', 'placeholder'],
}

export function blockFor(node: Node): BlockDef | undefined {
  return registry[node.type]
}

registry.Text = {
  type: 'Text',
  label: 'Texto',
  description: 'Títulos, párrafos, etiquetas o enlaces',
  icon: 'Type',
  category: 'Contenido',
  defaultSpan: 12,
  defaultProps: { text: 'Escribí tu texto', variant: 'paragraph' },
  fields: [
    { key: 'text', label: 'Texto', kind: 'textarea' },
    {
      key: 'variant',
      label: 'Tipo',
      kind: 'select',
      options: [
        { value: 'title', label: 'Título' },
        { value: 'subtitle', label: 'Subtítulo' },
        { value: 'paragraph', label: 'Párrafo' },
        { value: 'small', label: 'Chico' },
        { value: 'label', label: 'Etiqueta' },
      ],
    },
    { key: 'href', label: 'Enlace (opcional)', kind: 'text' },
    { key: 'newTab', label: 'Abrir en otra pestaña', kind: 'boolean' },
  ],
  readQueries: [],
  events: [],
  component: { name: 'Text', from: '@/components/blocks/text' },
  passProps: ['text', 'variant', 'href', 'newTab'],
}

registry.Image = {
  type: 'Image',
  label: 'Imagen',
  description: 'Una foto o logo desde una URL',
  icon: 'Image',
  category: 'Contenido',
  defaultSpan: 4,
  defaultProps: { src: '', alt: '', fit: 'cover', height: 180, rounded: true },
  fields: [
    { key: 'src', label: 'URL de la imagen', kind: 'text' },
    { key: 'alt', label: 'Descripción (accesibilidad)', kind: 'text' },
    {
      key: 'fit',
      label: 'Ajuste',
      kind: 'select',
      options: [
        { value: 'cover', label: 'Llenar y recortar' },
        { value: 'contain', label: 'Mostrar entera' },
      ],
    },
    { key: 'height', label: 'Alto (px, vacío = natural)', kind: 'number' },
    { key: 'rounded', label: 'Bordes redondeados', kind: 'boolean' },
    { key: 'caption', label: 'Epígrafe', kind: 'text' },
  ],
  readQueries: [],
  events: [],
  component: { name: 'Image', from: '@/components/blocks/image' },
  passProps: ['src', 'alt', 'fit', 'height', 'rounded', 'caption'],
}

registry.Divider = {
  type: 'Divider',
  label: 'Separador',
  description: 'Una línea entre bloques, con texto opcional',
  icon: 'Minus',
  category: 'Contenido',
  defaultSpan: 12,
  defaultProps: { label: '', spacing: 8 },
  fields: [
    { key: 'label', label: 'Texto en el medio', kind: 'text' },
    { key: 'spacing', label: 'Aire arriba y abajo (px)', kind: 'number' },
  ],
  readQueries: [],
  events: [],
  component: { name: 'Divider', from: '@/components/blocks/divider' },
  passProps: ['label', 'spacing'],
}

registry.Spacer = {
  type: 'Spacer',
  label: 'Espacio',
  description: 'Espacio vacío para separar',
  icon: 'MoveVertical',
  category: 'Contenido',
  defaultSpan: 12,
  defaultProps: { size: 24 },
  fields: [{ key: 'size', label: 'Alto (px)', kind: 'number' }],
  readQueries: [],
  events: [],
  component: { name: 'Spacer', from: '@/components/blocks/divider' },
  passProps: ['size'],
}

registry.Stack = {
  type: 'Stack',
  label: 'Fila / columna',
  description: 'Pone bloques uno al lado del otro (o abajo) con el tamaño de su contenido',
  icon: 'Columns3',
  category: 'Contenedores',
  defaultSpan: 12,
  defaultProps: { direction: 'row', gap: 'md', align: 'center', justify: 'start', wrap: true, stackOnMobile: false },
  fields: [
    {
      key: 'direction',
      label: 'Dirección',
      kind: 'select',
      options: [
        { value: 'row', label: 'En fila (al lado)' },
        { value: 'column', label: 'En columna (abajo)' },
      ],
    },
    {
      key: 'gap',
      label: 'Separación',
      kind: 'select',
      options: [
        { value: 'none', label: 'Nada' },
        { value: 'sm', label: 'Poca' },
        { value: 'md', label: 'Media' },
        { value: 'lg', label: 'Mucha' },
      ],
    },
    {
      key: 'justify',
      label: 'Repartir',
      kind: 'select',
      options: [
        { value: 'start', label: 'Al inicio' },
        { value: 'center', label: 'Al centro' },
        { value: 'end', label: 'Al final' },
        { value: 'between', label: 'Separados a los extremos' },
      ],
    },
    {
      key: 'align',
      label: 'Alinear',
      kind: 'select',
      options: [
        { value: 'start', label: 'Arriba / izquierda' },
        { value: 'center', label: 'Centro' },
        { value: 'end', label: 'Abajo / derecha' },
        { value: 'stretch', label: 'Estirar' },
      ],
    },
    { key: 'wrap', label: 'Pasar a otra línea si no entra', kind: 'boolean' },
    { key: 'stackOnMobile', label: 'En celular, uno abajo del otro', kind: 'boolean' },
  ],
  readQueries: [],
  events: [],
  component: { name: 'Stack', from: '@/components/blocks/stack' },
  passProps: ['direction', 'gap', 'align', 'justify', 'wrap', 'stackOnMobile'],
  container: 'flex',
}

registry.Repeater = {
  type: 'Repeater',
  label: 'Lista repetida',
  description: 'Repite lo que pongas adentro por cada registro: tarjetas, galerías, listas',
  icon: 'Repeat',
  category: 'Contenedores',
  defaultSpan: 12,
  defaultProps: { emptyText: 'No hay nada para mostrar.' },
  fields: [
    { key: 'query', label: 'Repetir por cada registro de', kind: 'query', method: 'GET' },
    { key: 'emptyText', label: 'Texto si no hay registros', kind: 'text' },
  ],
  readQueries: ['query'],
  events: [],
  component: { name: 'Repeater', from: '@/components/blocks/repeater' },
  passProps: ['emptyText'],
  container: 'grid',
}

registry.Kanban = {
  type: 'Kanban',
  label: 'Kanban',
  description: 'Tarjetas en columnas por estado. Arrastrá una tarjeta para cambiarla de columna',
  icon: 'Columns3',
  category: 'Datos',
  defaultSpan: 12,
  defaultProps: { title: 'Tablero', groupField: 'status', columns: '', titleField: 'title', currency: '' },
  fields: [
    { key: 'title', label: 'Título', kind: 'text' },
    { key: 'query', label: 'Datos', kind: 'query', method: 'GET' },
    { key: 'groupField', label: 'Columna según el campo', kind: 'field', queryKey: 'query' },
    { key: 'columns', label: 'Orden de columnas (separadas por coma, opcional)', kind: 'text' },
    { key: 'titleField', label: 'Título de la tarjeta', kind: 'field', queryKey: 'query' },
    { key: 'subtitleField', label: 'Subtítulo de la tarjeta', kind: 'field', queryKey: 'query' },
    { key: 'amountField', label: 'Monto (se suma por columna)', kind: 'field', queryKey: 'query' },
    { key: 'currency', label: 'Signo del monto, ej: $', kind: 'text' },
  ],
  readQueries: ['query'],
  events: [
    { name: 'onCardMove', label: 'Al mover una tarjeta (la fila ya trae la columna nueva)', arg: 'row' },
    { name: 'onCardClick', label: 'Al hacer clic en una tarjeta', arg: 'row' },
  ],
  component: { name: 'Kanban', from: '@/components/blocks/kanban' },
  passProps: ['title', 'groupField', 'columns', 'titleField', 'subtitleField', 'amountField', 'currency'],
}
