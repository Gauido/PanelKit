import type { RuntimeFiles } from '@panelkit/exporter'

// The exact source of @panelkit/blocks, bundled as text so the exporter can copy it.
const modules = import.meta.glob('../../../../packages/blocks/src/**/*.{ts,tsx,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const runtimeFiles: RuntimeFiles = Object.fromEntries(
  Object.entries(modules).map(([path, content]) => [path.replace(/^.*packages\/blocks\/src\//, ''), content]),
)
