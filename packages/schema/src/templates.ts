import { Project, type Project as ProjectT } from './schema'

export type Template = {
  id: string
  name: string
  description: string
  /** lucide icon name */
  icon: string
  project: ProjectT
}

const contacts = [
  { id: 1, name: 'Ana Gómez', email: 'ana@acme.com', phone: '11 4555 0101', company: 'Acme', city: 'Córdoba', stage: 'Cliente' },
  { id: 2, name: 'Bruno Díaz', email: 'bruno@globex.com', phone: '11 4555 0102', company: 'Globex', city: 'Rosario', stage: 'Propuesta' },
  { id: 3, name: 'Carla Ruiz', email: 'carla@initech.com', phone: '11 4555 0103', company: 'Initech', city: 'Mendoza', stage: 'Lead' },
  { id: 4, name: 'Diego Paz', email: 'diego@umbrella.com', phone: '11 4555 0104', company: 'Umbrella', city: 'La Plata', stage: 'Calificado' },
  { id: 5, name: 'Elena Sosa', email: 'elena@hooli.com', phone: '11 4555 0105', company: 'Hooli', city: 'Salta', stage: 'Cliente' },
  { id: 6, name: 'Fede Luna', email: 'fede@acme.com', phone: '11 4555 0106', company: 'Acme', city: 'Córdoba', stage: 'Lead' },
  { id: 7, name: 'Gala Ríos', email: 'gala@globex.com', phone: '11 4555 0107', company: 'Globex', city: 'Neuquén', stage: 'Propuesta' },
  { id: 8, name: 'Hugo Vera', email: 'hugo@initech.com', phone: '11 4555 0108', company: 'Initech', city: 'Rosario', stage: 'Cliente' },
]

const deals = [
  { id: 1, title: 'Licencias anuales', company: 'Acme', amount: 12500, stage: 'Ganada' },
  { id: 2, title: 'Implementación', company: 'Globex', amount: 8400, stage: 'Negociación' },
  { id: 3, title: 'Soporte premium', company: 'Hooli', amount: 4300, stage: 'Propuesta' },
  { id: 4, title: 'Migración de datos', company: 'Initech', amount: 15600, stage: 'Ganada' },
  { id: 5, title: 'Capacitación', company: 'Umbrella', amount: 2900, stage: 'Perdida' },
  { id: 6, title: 'Integración API', company: 'Acme', amount: 7450, stage: 'Negociación' },
]

const tasks = [
  { id: 1, title: 'Llamar a Bruno por la propuesta', owner: 'Franco', due: '2026-11-25', done: 'Pendiente' },
  { id: 2, title: 'Enviar contrato a Acme', owner: 'Lucía', due: '2026-11-26', done: 'Hecha' },
  { id: 3, title: 'Demo con Initech', owner: 'Franco', due: '2026-11-27', done: 'Pendiente' },
  { id: 4, title: 'Seguimiento Umbrella', owner: 'Mateo', due: '2026-11-28', done: 'Pendiente' },
  { id: 5, title: 'Factura Hooli', owner: 'Lucía', due: '2026-11-24', done: 'Hecha' },
]

export const crmTemplate: ProjectT = Project.parse({
  version: 1,
  name: 'Mi CRM',
  theme: { preset: 'moderno', accent: 'violet', radius: 14, mode: 'system', font: 'Inter', surface: 'cool', motion: 'normal' },
  dataSources: [{ id: 'demo', type: 'static', name: 'Datos de ejemplo', tables: { contacts, deals, tasks } }],
  queries: [
    { id: 'contacts', source: 'demo', method: 'GET', path: '/contacts', fields: ['id', 'name', 'email', 'phone', 'company', 'city', 'stage'] },
    { id: 'deals', source: 'demo', method: 'GET', path: '/deals', fields: ['id', 'title', 'company', 'amount', 'stage'] },
    { id: 'tasks', source: 'demo', method: 'GET', path: '/tasks', fields: ['id', 'title', 'owner', 'due', 'done'] },
    { id: 'createContact', source: 'demo', method: 'POST', path: '/contacts', fields: [] },
    { id: 'deleteContact', source: 'demo', method: 'DELETE', path: '/contacts/{{row.id}}', fields: [] },
    { id: 'updateContact', source: 'demo', method: 'PUT', path: '/contacts/{{state.seleccionado.id}}', fields: [] },
  ],
  pages: [
    {
      id: 'dashboard',
      path: '/',
      title: 'Dashboard',
      icon: 'LayoutDashboard',
      children: [
        { id: 'h1', type: 'PageHeader', props: { title: 'Hola de nuevo', subtitle: 'Así viene tu negocio esta semana' } },
        { id: 'k1', type: 'KpiCard', layout: { span: 3 }, props: { title: 'Contactos', query: 'contacts', aggregate: 'count', icon: 'Users', delta: 12 } },
        { id: 'k2', type: 'KpiCard', layout: { span: 3 }, props: { title: 'Oportunidades', query: 'deals', aggregate: 'count', icon: 'Briefcase', delta: 8 } },
        { id: 'k3', type: 'KpiCard', layout: { span: 3 }, props: { title: 'Tareas', query: 'tasks', aggregate: 'count', icon: 'Activity', delta: -3 } },
        { id: 'k4', type: 'KpiCard', layout: { span: 3 }, props: { title: 'En juego', query: 'deals', aggregate: 'sum', field: 'amount', prefix: '$', icon: 'DollarSign', delta: 21 } },
        { id: 'ch1', type: 'Chart', layout: { span: 7 }, props: { title: 'Monto por empresa', query: 'deals', chartType: 'bar', labelField: 'company', aggregate: 'sum', valueField: 'amount', dateGroup: 'none', height: 220 } },
        { id: 'ch2', type: 'Chart', layout: { span: 5 }, props: { title: 'Contactos por etapa', query: 'contacts', chartType: 'donut', labelField: 'stage', aggregate: 'count', dateGroup: 'none', height: 220 } },
        {
          id: 't0',
          type: 'DataTable',
          layout: { span: 7 },
          props: {
            title: 'Oportunidades',
            query: 'deals',
            pageSize: 5,
            searchable: false,
            columns: [
              { field: 'title', label: 'Oportunidad' },
              { field: 'company', label: 'Empresa' },
              { field: 'amount', label: 'Monto', format: 'money' },
              { field: 'stage', label: 'Etapa', format: 'badge' },
            ],
          },
        },
        {
          id: 't1',
          type: 'DataTable',
          layout: { span: 5 },
          props: { title: 'Tareas', query: 'tasks', pageSize: 5, searchable: false, columns: [{ field: 'title', label: 'Tarea' }, { field: 'done', label: 'Estado', format: 'badge' }] },
          events: { onRowClick: [{ type: 'navigate', to: '/tareas' }] },
        },
      ],
    },
    {
      id: 'contactos',
      path: '/contactos',
      title: 'Contactos',
      icon: 'Users',
      children: [
        { id: 'h2', type: 'PageHeader', layout: { span: 9 }, props: { title: 'Contactos', subtitle: 'Personas y empresas con las que trabajás' } },
        {
          id: 'b1',
          type: 'ActionButton',
          layout: { span: 3 },
          style: { align: 'right' },
          props: { label: 'Exportar', variant: 'outline' },
          events: { onClick: [{ type: 'toast', message: 'Exportación iniciada', tone: 'info' }] },
        },
        {
          id: 't2',
          type: 'DataTable',
          layout: { span: 7 },
          props: {
            title: 'Todos los contactos',
            query: 'contacts',
            pageSize: 8,
            searchable: true,
            filterField: 'stage',
            columns: [
              { field: 'name', label: 'Nombre' },
              { field: 'email', label: 'Email', format: 'email' },
              { field: 'company', label: 'Empresa' },
              { field: 'stage', label: 'Etapa', format: 'badge' },
            ],
          },
          events: {
            onRowClick: [
              { type: 'setState', key: 'seleccionado', value: '{{row}}' },
              { type: 'openModal', target: 'm_contacto' },
            ],
            onRowDelete: [
              { type: 'confirm', message: '¿Eliminar a {{row.name}}?' },
              { type: 'callQuery', query: 'deleteContact', body: 'none' },
              { type: 'toast', message: 'Contacto eliminado', tone: 'success' },
              { type: 'refresh' },
            ],
          },
        },
        {
          id: 'f1',
          type: 'EntityForm',
          layout: { span: 5 },
          props: {
            title: 'Nuevo contacto',
            description: 'Se agrega a la lista al instante',
            submitLabel: 'Crear contacto',
            fields: [
              { name: 'name', label: 'Nombre', type: 'text', required: true, minLength: 3, message: 'Ingresá al menos 3 letras', span: 2 },
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'phone', label: 'Teléfono', type: 'text', pattern: '[0-9 +()-]{6,}', message: 'Solo números y + ( ) -' },
              { name: 'company', label: 'Empresa', type: 'text' },
              { name: 'stage', label: 'Etapa', type: 'select', options: 'Lead, Calificado, Propuesta, Cliente' },
            ],
          },
          events: {
            onSubmit: [
              { type: 'callQuery', query: 'createContact', body: 'values' },
              { type: 'toast', message: 'Contacto {{values.name}} creado', tone: 'success' },
              { type: 'refresh' },
            ],
          },
        },
        {
          id: 'm_contacto',
          type: 'Modal',
          props: { title: '{{state.seleccionado.name}}', description: '{{state.seleccionado.company}} · {{state.seleccionado.city}}', kind: 'drawer', size: 'md' },
          children: [
            {
              id: 'm_html',
              type: 'HtmlBlock',
              props: {
                html: '<div class="flex items-center gap-3 rounded-xl bg-muted p-4">\n  <div class="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">{{state.seleccionado.name}}</div>\n  <div><p class="font-medium">{{state.seleccionado.email}}</p><p class="text-sm opacity-70">{{state.seleccionado.phone}}</p></div>\n</div>',
              },
            },
            {
              id: 'm_form',
              type: 'EntityForm',
              props: {
                title: 'Editar contacto',
                submitLabel: 'Guardar cambios',
                initialValues: '{{state.seleccionado}}',
                fields: [
                  { name: 'name', label: 'Nombre', type: 'text', required: true, span: 2 },
                  { name: 'email', label: 'Email', type: 'email', required: true },
                  { name: 'phone', label: 'Teléfono', type: 'tel' },
                  { name: 'company', label: 'Empresa', type: 'text' },
                  { name: 'stage', label: 'Etapa', type: 'select', options: 'Lead, Calificado, Propuesta, Cliente' },
                ],
              },
              events: {
                onSubmit: [
                  { type: 'callQuery', query: 'updateContact', body: 'values' },
                  { type: 'toast', message: '{{values.name}} actualizado', tone: 'success' },
                  { type: 'closeModal', target: 'm_contacto' },
                  { type: 'refresh' },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'directorio',
      path: '/directorio',
      title: 'Directorio',
      icon: 'Users',
      children: [
        {
          id: 'd_top',
          type: 'Stack',
          props: { direction: 'row', gap: 'md', align: 'center', justify: 'between', wrap: true, stackOnMobile: true },
          style: { css: { 'padding-bottom': '4px' } },
          children: [
            { id: 'd_title', type: 'Text', props: { text: 'Directorio', variant: 'title' } },
            { id: 'd_sub', type: 'Text', props: { text: 'Tus contactos como tarjetas', variant: 'small' } },
          ],
        },
        {
          id: 'd_list',
          type: 'Repeater',
          props: { query: 'contacts', emptyText: 'Todavía no hay contactos.' },
          children: [
            {
              id: 'd_card',
              type: 'Section',
              layout: { span: 4 },
              props: { title: '{{item.name}}', description: '{{item.company}} · {{item.city}}', card: true },
              children: [
                { id: 'd_mail', type: 'Text', props: { text: '{{item.email}}', variant: 'small' } },
                { id: 'd_phone', type: 'Text', props: { text: '{{item.phone}}', variant: 'small' } },
                { id: 'd_client', type: 'Text', props: { text: 'Cliente', variant: 'label' }, style: { textColor: 'success' }, visibleIf: "item.stage === 'Cliente'" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'tareas',
      path: '/tareas',
      title: 'Tareas',
      icon: 'CalendarDays',
      children: [
        { id: 'h3', type: 'PageHeader', props: { title: 'Tareas', subtitle: 'Seguimiento del equipo' } },
        {
          id: 't3',
          type: 'DataTable',
          props: {
            title: 'Pendientes y hechas',
            query: 'tasks',
            pageSize: 10,
            searchable: true,
            columns: [
              { field: 'title', label: 'Tarea' },
              { field: 'owner', label: 'Responsable' },
              { field: 'due', label: 'Vence', format: 'date' },
              { field: 'done', label: 'Estado', format: 'badge' },
            ],
          },
        },
      ],
    },
  ],
})

/** Sample dates around the day the project is created, so the agenda never looks empty. */
const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const bookings = [
  { id: 1, customer: 'Ana Gómez', court: 'Cancha 1', date: day(0), time: '18:00', duration: 60, amount: 24000, status: 'Pagada' },
  { id: 2, customer: 'Bruno Díaz', court: 'Cancha 2', date: day(0), time: '19:30', duration: 90, amount: 33000, status: 'Seña' },
  { id: 3, customer: 'Carla Ruiz', court: 'Cancha 1', date: day(0), time: '21:00', duration: 60, amount: 28000, status: 'Pendiente' },
  { id: 4, customer: 'Liga martes', court: 'Cancha 3', date: day(0), time: '20:00', duration: 120, amount: 40000, status: 'Pagada' },
  { id: 5, customer: 'Diego Paz', court: 'Cancha 3', date: day(1), time: '17:00', duration: 60, amount: 22000, status: 'Pagada' },
  { id: 6, customer: 'Elena Sosa', court: 'Cancha 2', date: day(1), time: '20:00', duration: 60, amount: 28000, status: 'Seña' },
  { id: 7, customer: 'Fede Luna', court: 'Cancha 3', date: day(2), time: '18:30', duration: 60, amount: 24000, status: 'Cancelada' },
  { id: 8, customer: 'Gala Ríos', court: 'Cancha 1', date: day(-1), time: '19:00', duration: 60, amount: 24000, status: 'Pagada' },
  { id: 9, customer: 'Hugo Vera', court: 'Cancha 2', date: day(-2), time: '22:00', duration: 60, amount: 28000, status: 'Pagada' },
  { id: 10, customer: 'Iris Mena', court: 'Cancha 1', date: day(3), time: '20:30', duration: 60, amount: 24000, status: 'Pendiente' },
]

const courts = [
  { id: 1, name: 'Cancha 1', surface: 'Césped sintético', roof: 'Techada', price: 24000 },
  { id: 2, name: 'Cancha 2', surface: 'Césped sintético', roof: 'Descubierta', price: 22000 },
  { id: 3, name: 'Cancha 3', surface: 'Cemento', roof: 'Techada', price: 20000 },
]

export const turnosTemplate: ProjectT = Project.parse({
  version: 1,
  name: 'Reservas de canchas',
  theme: { preset: 'cancha', accent: 'emerald', primary: '#416900', radius: 12, mode: 'light', font: 'Plus Jakarta Sans', surface: 'warm', motion: 'subtle' },
  dataSources: [{ id: 'club', type: 'static', name: 'Datos del club', tables: { bookings, courts } }],
  queries: [
    { id: 'bookings', source: 'club', method: 'GET', path: '/bookings', fields: ['id', 'customer', 'court', 'date', 'time', 'duration', 'amount', 'status'] },
    { id: 'courts', source: 'club', method: 'GET', path: '/courts', fields: ['id', 'name', 'surface', 'roof', 'price'] },
    { id: 'bookingsFiltered', source: 'club', method: 'GET', path: '/bookings?court={{state.cancha}}&date={{state.dia}}', fields: ['id', 'customer', 'court', 'date', 'time', 'duration', 'amount', 'status'] },
    { id: 'createBooking', source: 'club', method: 'POST', path: '/bookings', fields: [] },
    { id: 'deleteBooking', source: 'club', method: 'DELETE', path: '/bookings/{{row.id}}', fields: [] },
    { id: 'createCourt', source: 'club', method: 'POST', path: '/courts', fields: [] },
  ],
  pages: [
    {
      id: 'agenda',
      path: '/',
      title: 'Agenda',
      icon: 'LayoutGrid',
      children: [
        { id: 'a1', type: 'PageHeader', props: { title: 'Agenda del club', subtitle: 'Turnos, cobros y canchas de un vistazo' } },
        { id: 'a2', type: 'KpiCard', layout: { span: 4 }, props: { title: 'Reservas', query: 'bookings', aggregate: 'count', icon: 'Activity', delta: 15 } },
        { id: 'a3', type: 'KpiCard', layout: { span: 4 }, props: { title: 'Facturado', query: 'bookings', aggregate: 'sum', field: 'amount', prefix: '$', icon: 'DollarSign', delta: 9 } },
        { id: 'a4', type: 'KpiCard', layout: { span: 4 }, props: { title: 'Canchas', query: 'courts', aggregate: 'count', icon: 'Briefcase' } },
        {
          id: 'g1',
          type: 'AvailabilityGrid',
          props: {
            title: 'Disponibilidad',
            query: 'bookings',
            resources: 'Cancha 1, Cancha 2, Cancha 3',
            resourceField: 'court',
            dateField: 'date',
            timeField: 'time',
            durationField: 'duration',
            labelField: 'customer',
            statusField: 'status',
            startTime: '16:00',
            endTime: '24:00',
            slotMinutes: 30,
          },
          events: {
            onSlotClick: [
              { type: 'setState', key: 'nuevo', value: '{{slot}}' },
              { type: 'openModal', target: 'm_nuevo' },
            ],
            onBookingClick: [
              { type: 'setState', key: 'turno', value: '{{row}}' },
              { type: 'openModal', target: 'm_turno' },
            ],
          },
        },
        {
          id: 'f_cancha',
          type: 'Filter',
          layout: { span: 4 },
          props: { label: 'Cancha', inputType: 'select', stateKey: 'cancha', optionsQuery: 'courts', optionLabel: 'name', optionValue: 'name', allLabel: 'Todas' },
        },
        {
          id: 'f_dia',
          type: 'Filter',
          layout: { span: 4 },
          props: { label: 'Día', inputType: 'date', stateKey: 'dia' },
        },
        {
          id: 'a5',
          type: 'DataTable',
          layout: { span: 8 },
          events: {
            onRowDelete: [
              { type: 'confirm', message: '¿Cancelar el turno de {{row.customer}}?' },
              { type: 'callQuery', query: 'deleteBooking', body: 'none' },
              { type: 'toast', message: 'Turno eliminado', tone: 'success' },
              { type: 'refresh' },
            ],
          },
          props: {
            title: 'Próximos turnos',
            filterField: 'status',
            query: 'bookingsFiltered',
            pageSize: 6,
            searchable: true,
            columns: [
              { field: 'date', label: 'Día', format: 'date' },
              { field: 'time', label: 'Hora' },
              { field: 'court', label: 'Cancha' },
              { field: 'customer', label: 'Cliente' },
              { field: 'status', label: 'Estado', format: 'badge' },
            ],
          },
        },
        {
          id: 'a6',
          type: 'EntityForm',
          layout: { span: 4 },
          props: {
            title: 'Nuevo turno',
            submitLabel: 'Reservar',
            fields: [
              { name: 'customer', label: 'Cliente', type: 'text', required: true, span: 2 },
              { name: 'court', label: 'Cancha', type: 'select', optionsQuery: 'courts', optionLabel: 'name', optionValue: 'name', required: true, span: 2 },
              { name: 'date', label: 'Día', type: 'date', required: true },
              { name: 'time', label: 'Hora', type: 'time', required: true },
              { name: 'amount', label: 'Monto', type: 'number', min: 0 },
              { name: 'status', label: 'Estado', type: 'select', options: 'Pendiente, Seña, Pagada' },
            ],
          },
          events: {
            onSubmit: [
              { type: 'callQuery', query: 'createBooking', body: 'values' },
              { type: 'toast', message: 'Turno reservado para {{values.customer}}', tone: 'success' },
              { type: 'refresh' },
            ],
          },
        },
        {
          id: 'm_nuevo',
          type: 'Modal',
          props: { title: 'Nuevo turno', description: '{{state.nuevo.resource}} · {{state.nuevo.date}} a las {{state.nuevo.time}}', kind: 'modal', size: 'md' },
          children: [
            {
              id: 'mn_form',
              type: 'EntityForm',
              props: {
                submitLabel: 'Reservar',
                initialValues: '{{state.nuevo}}',
                fields: [
                  { name: 'customer', label: 'Cliente', type: 'text', required: true, span: 2 },
                  { name: 'court', label: 'Cancha', type: 'select', optionsQuery: 'courts', optionLabel: 'name', optionValue: 'name', required: true },
                  { name: 'status', label: 'Estado', type: 'select', options: 'Pendiente, Seña, Pagada', required: true },
                  { name: 'date', label: 'Día', type: 'date', required: true },
                  { name: 'time', label: 'Hora', type: 'time', required: true },
                  { name: 'duration', label: 'Duración (min)', type: 'number', min: 30 },
                  { name: 'amount', label: 'Monto', type: 'number', min: 0 },
                ],
              },
              events: {
                onSubmit: [
                  { type: 'callQuery', query: 'createBooking', body: 'values' },
                  { type: 'toast', message: 'Turno reservado para {{values.customer}}', tone: 'success' },
                  { type: 'closeModal', target: 'm_nuevo' },
                  { type: 'refresh' },
                ],
              },
            },
          ],
        },
        {
          id: 'm_turno',
          type: 'Modal',
          props: { title: 'Turno de {{state.turno.customer}}', description: '{{state.turno.court}} · {{state.turno.date}} {{state.turno.time}}', kind: 'drawer', size: 'sm' },
          children: [
            {
              id: 'mt_html',
              type: 'HtmlBlock',
              props: {
                html: '<dl class="grid grid-cols-2 gap-3 text-sm">\n  <div class="rounded-xl bg-muted p-3"><dt class="opacity-60">Estado</dt><dd class="text-base font-semibold">{{state.turno.status}}</dd></div>\n  <div class="rounded-xl bg-muted p-3"><dt class="opacity-60">Monto</dt><dd class="text-base font-semibold">$ {{state.turno.amount}}</dd></div>\n  <div class="rounded-xl bg-muted p-3"><dt class="opacity-60">Duración</dt><dd class="text-base font-semibold">{{state.turno.duration}} min</dd></div>\n  <div class="rounded-xl bg-muted p-3"><dt class="opacity-60">Cancha</dt><dd class="text-base font-semibold">{{state.turno.court}}</dd></div>\n</dl>',
              },
            },
            {
              id: 'mt_pay',
              type: 'ActionButton',
              layout: { span: 6 },
              props: { label: 'Marcar como pagado', variant: 'primary', fullWidth: true },
              events: {
                onClick: [
                  {
                    type: 'runCode',
                    code: "// Código propio: cualquier lógica que no entre en una acción.\nawait apis.datosDelClub.request('PATCH', '/bookings/' + state.turno.id, { status: 'Pagada' })\ntoast('Cobrado: $' + state.turno.amount)",
                  },
                  { type: 'closeModal', target: 'm_turno' },
                  { type: 'refresh' },
                ],
              },
            },
            {
              id: 'mt_close',
              type: 'ActionButton',
              layout: { span: 6 },
              props: { label: 'Cerrar', variant: 'outline', fullWidth: true },
              events: { onClick: [{ type: 'closeModal', target: 'm_turno' }] },
            },
          ],
        },
      ],
    },
    {
      id: 'calendario',
      path: '/calendario',
      title: 'Calendario',
      icon: 'CalendarDays',
      children: [
        { id: 'cal1', type: 'PageHeader', props: { title: 'Calendario', subtitle: 'Todos los turnos de la semana o del mes' } },
        {
          id: 'cal2',
          type: 'Calendar',
          props: { title: 'Turnos', query: 'bookings', dateField: 'date', timeField: 'time', titleField: 'customer', statusField: 'status', view: 'week' },
          events: { onEventClick: [{ type: 'toast', message: '{{row.customer}} · {{row.court}} · {{row.status}}', tone: 'info' }] },
        },
      ],
    },
    {
      id: 'reportes',
      path: '/reportes',
      title: 'Reportes',
      icon: 'BarChart3',
      children: [
        { id: 'r1', type: 'PageHeader', props: { title: 'Reportes', subtitle: 'Cómo viene el club' } },
        { id: 'r2', type: 'Chart', layout: { span: 7 }, props: { title: 'Facturación por cancha', query: 'bookings', chartType: 'bar', labelField: 'court', aggregate: 'sum', valueField: 'amount', dateGroup: 'none', height: 240 } },
        { id: 'r3', type: 'Chart', layout: { span: 5 }, props: { title: 'Turnos por estado', query: 'bookings', chartType: 'donut', labelField: 'status', aggregate: 'count', dateGroup: 'none', height: 240 } },
        { id: 'r4', type: 'Chart', layout: { span: 8 }, props: { title: 'Ingresos por día', query: 'bookings', chartType: 'area', labelField: 'date', aggregate: 'sum', valueField: 'amount', dateGroup: 'day', height: 220 } },
        { id: 'r5', type: 'Timeline', layout: { span: 4 }, props: { title: 'Últimas reservas', query: 'bookings', titleField: 'customer', descriptionField: 'court', dateField: 'date', statusField: 'status', order: 'desc', limit: 5 } },
      ],
    },
    {
      id: 'canchas',
      path: '/canchas',
      title: 'Canchas',
      icon: 'LayoutDashboard',
      children: [
        { id: 'c1', type: 'PageHeader', props: { title: 'Canchas', subtitle: 'Superficie, techo y precio por turno' } },
        {
          id: 'c_tabs',
          type: 'Tabs',
          props: { variant: 'underline' },
          children: [
            {
              id: 'c_list',
              type: 'Section',
              props: { title: 'Listado', card: false },
              children: [
                {
                  id: 'c2',
                  type: 'DataTable',
                  props: {
                    title: 'Todas las canchas',
                    query: 'courts',
                    searchable: false,
                    columns: [
                      { field: 'name', label: 'Cancha' },
                      { field: 'surface', label: 'Superficie', format: 'badge' },
                      { field: 'roof', label: 'Techo' },
                      { field: 'price', label: 'Precio', format: 'money' },
                    ],
                  },
                },
              ],
            },
            {
              id: 'c_new',
              type: 'Section',
              props: { title: 'Nueva cancha', card: false },
              children: [
                {
                  id: 'c3',
                  type: 'EntityForm',
                  layout: { span: 6 },
                  props: {
                    title: 'Nueva cancha',
                    submitLabel: 'Agregar',
                    fields: [
                      { name: 'name', label: 'Nombre', type: 'text', required: true, span: 2 },
                      { name: 'surface', label: 'Superficie', type: 'select', options: 'Césped sintético, Cemento, Polvo de ladrillo' },
                      { name: 'roof', label: 'Techo', type: 'select', options: 'Techada, Descubierta' },
                      { name: 'price', label: 'Precio por turno', type: 'number', min: 0, required: true },
                    ],
                  },
                  events: {
                    onSubmit: [
                      { type: 'callQuery', query: 'createCourt', body: 'values' },
                      { type: 'toast', message: '{{values.name}} agregada', tone: 'success' },
                      { type: 'refresh' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

export const blankTemplate: ProjectT = Project.parse({
  version: 1,
  name: 'Proyecto nuevo',
  dataSources: [{ id: 'datos', type: 'static', name: 'Datos de ejemplo', tables: { items: [{ id: 1, nombre: 'Primer registro', estado: 'Activo' }] } }],
  queries: [{ id: 'items', source: 'datos', method: 'GET', path: '/items', fields: ['id', 'nombre', 'estado'] }],
  pages: [{ id: 'inicio', path: '/', title: 'Inicio', icon: 'LayoutDashboard', children: [{ id: 'b1', type: 'PageHeader', props: { title: 'Inicio', subtitle: 'Arrastrá bloques desde la izquierda para empezar' } }] }],
})

export const templates: Template[] = [
  { id: 'crm', name: 'CRM', description: 'Contactos, oportunidades y tareas, con dashboard', icon: 'Users', project: crmTemplate },
  { id: 'turnos', name: 'Turnos y reservas', description: 'Agenda, cobros y canchas, estilo BotTurno', icon: 'CalendarDays', project: turnosTemplate },
  { id: 'blank', name: 'En blanco', description: 'Una página vacía y datos de ejemplo', icon: 'LayoutDashboard', project: blankTemplate },
]
