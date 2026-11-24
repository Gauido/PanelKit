import { Project, type Project as ProjectT } from './schema'

/** "CRM básico" starter, wired to the public JSONPlaceholder demo API. */
export const crmTemplate: ProjectT = Project.parse({
  version: 1,
  name: 'Mi CRM',
  theme: { accent: 'violet', radius: 14, mode: 'system' },
  dataSources: [{ id: 'demo', type: 'rest', name: 'Demo API', baseUrl: 'https://jsonplaceholder.typicode.com', headers: {} }],
  queries: [
    { id: 'contacts', source: 'demo', method: 'GET', path: '/users', fields: ['id', 'name', 'username', 'email', 'phone', 'website', 'company.name', 'address.city'] },
    { id: 'deals', source: 'demo', method: 'GET', path: '/posts', fields: ['id', 'userId', 'title', 'body'] },
    { id: 'tasks', source: 'demo', method: 'GET', path: '/todos', fields: ['id', 'userId', 'title', 'completed'] },
    { id: 'createContact', source: 'demo', method: 'POST', path: '/users', fields: [] },
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
        { id: 'k4', type: 'KpiCard', layout: { span: 3 }, props: { title: 'Ingresos', aggregate: 'static', value: 48250, prefix: '$', icon: 'DollarSign', delta: 21 } },
        {
          id: 't1',
          type: 'DataTable',
          props: {
            title: 'Contactos recientes',
            query: 'contacts',
            pageSize: 5,
            searchable: true,
            columns: [
              { field: 'name', label: 'Nombre' },
              { field: 'email', label: 'Email', format: 'email' },
              { field: 'company.name', label: 'Empresa', format: 'badge' },
              { field: 'address.city', label: 'Ciudad' },
            ],
          },
          events: { onRowClick: [{ type: 'navigate', to: '/contactos' }] },
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
              { field: 'phone', label: 'Teléfono' },
              { field: 'company.name', label: 'Empresa', format: 'badge' },
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
            description: 'Se envía a tu API con un POST',
            submitLabel: 'Crear contacto',
            fields: [
              { name: 'name', label: 'Nombre', type: 'text', required: true, minLength: 3, message: 'Ingresá al menos 3 letras', span: 2 },
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'phone', label: 'Teléfono', type: 'text', pattern: '[0-9 +()-]{6,}', message: 'Solo números y + ( ) -' },
              { name: 'stage', label: 'Etapa', type: 'select', options: 'Lead, Calificado, Propuesta, Cliente' },
              { name: 'notes', label: 'Notas', type: 'textarea' },
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
              { field: 'userId', label: 'Responsable', format: 'number' },
              { field: 'completed', label: 'Hecha', format: 'badge' },
            ],
          },
        },
      ],
    },
  ],
})
