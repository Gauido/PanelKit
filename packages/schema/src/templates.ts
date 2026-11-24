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
              { field: 'amount', label: 'Monto', format: 'number' },
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
            columns: [
              { field: 'name', label: 'Nombre' },
              { field: 'email', label: 'Email', format: 'email' },
              { field: 'company', label: 'Empresa' },
              { field: 'stage', label: 'Etapa', format: 'badge' },
            ],
          },
          events: { onRowClick: [{ type: 'toast', message: 'Elegiste a {{row.name}}', tone: 'info' }] },
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

const bookings = [
  { id: 1, customer: 'Ana Gómez', court: 'Cancha 1', date: '2026-11-24', time: '18:00', amount: 24000, status: 'Pagada' },
  { id: 2, customer: 'Bruno Díaz', court: 'Cancha 2', date: '2026-11-24', time: '19:30', amount: 24000, status: 'Seña' },
  { id: 3, customer: 'Carla Ruiz', court: 'Cancha 1', date: '2026-11-24', time: '21:00', amount: 28000, status: 'Pendiente' },
  { id: 4, customer: 'Diego Paz', court: 'Cancha 3', date: '2026-11-25', time: '17:00', amount: 22000, status: 'Pagada' },
  { id: 5, customer: 'Elena Sosa', court: 'Cancha 2', date: '2026-11-25', time: '20:00', amount: 28000, status: 'Seña' },
  { id: 6, customer: 'Fede Luna', court: 'Cancha 3', date: '2026-11-26', time: '18:30', amount: 24000, status: 'Cancelada' },
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
    { id: 'bookings', source: 'club', method: 'GET', path: '/bookings', fields: ['id', 'customer', 'court', 'date', 'time', 'amount', 'status'] },
    { id: 'courts', source: 'club', method: 'GET', path: '/courts', fields: ['id', 'name', 'surface', 'roof', 'price'] },
    { id: 'createBooking', source: 'club', method: 'POST', path: '/bookings', fields: [] },
  ],
  pages: [
    {
      id: 'agenda',
      path: '/',
      title: 'Agenda',
      icon: 'CalendarDays',
      children: [
        { id: 'a1', type: 'PageHeader', props: { title: 'Agenda del club', subtitle: 'Turnos, cobros y canchas de un vistazo' } },
        { id: 'a2', type: 'KpiCard', layout: { span: 4 }, props: { title: 'Reservas', query: 'bookings', aggregate: 'count', icon: 'Activity', delta: 15 } },
        { id: 'a3', type: 'KpiCard', layout: { span: 4 }, props: { title: 'Facturado', query: 'bookings', aggregate: 'sum', field: 'amount', prefix: '$', icon: 'DollarSign', delta: 9 } },
        { id: 'a4', type: 'KpiCard', layout: { span: 4 }, props: { title: 'Canchas', query: 'courts', aggregate: 'count', icon: 'Briefcase' } },
        {
          id: 'a5',
          type: 'DataTable',
          layout: { span: 8 },
          props: {
            title: 'Próximos turnos',
            query: 'bookings',
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
              { name: 'court', label: 'Cancha', type: 'select', options: 'Cancha 1, Cancha 2, Cancha 3', required: true, span: 2 },
              { name: 'date', label: 'Día', type: 'date', required: true },
              { name: 'time', label: 'Hora', type: 'text', pattern: '[0-2][0-9]:[0-5][0-9]', message: 'Usá el formato 18:30', placeholder: '18:30', required: true },
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
              { field: 'price', label: 'Precio', format: 'number' },
            ],
          },
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
