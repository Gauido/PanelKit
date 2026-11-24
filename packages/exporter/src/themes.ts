import type { Theme } from '@panelkit/schema'

export type ThemePreset = {
  id: string
  name: string
  description: string
  /** Swatch colors for the picker: background, card, primary. */
  swatch: [string, string, string]
  theme: Omit<Theme, 'preset'>
}

export const themePresets: ThemePreset[] = [
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Violeta, Inter, bordes suaves',
    swatch: ['oklch(0.985 0.002 270)', '#fff', 'oklch(0.56 0.22 285)'],
    theme: { accent: 'violet', radius: 14, mode: 'system', font: 'Inter', surface: 'cool', motion: 'normal' },
  },
  {
    id: 'cancha',
    name: 'Cancha',
    description: 'Verde césped sobre crema, editorial',
    swatch: ['oklch(0.975 0.01 95)', '#fff', '#416900'],
    theme: { accent: 'emerald', primary: '#416900', radius: 12, mode: 'light', font: 'Plus Jakarta Sans', surface: 'warm', motion: 'subtle' },
  },
  {
    id: 'oceano',
    name: 'Océano',
    description: 'Azul profundo y redondeado',
    swatch: ['oklch(0.985 0.002 270)', '#fff', 'oklch(0.58 0.2 255)'],
    theme: { accent: 'blue', radius: 18, mode: 'system', font: 'DM Sans', surface: 'cool', motion: 'normal' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Blanco y negro, esquinas rectas',
    swatch: ['oklch(0.985 0 0)', '#fff', 'oklch(0.22 0 0)'],
    theme: { accent: 'violet', primary: 'oklch(0.22 0 0)', radius: 6, mode: 'light', font: 'Geist', surface: 'neutral', motion: 'subtle' },
  },
  {
    id: 'atardecer',
    name: 'Atardecer',
    description: 'Coral cálido y animaciones con rebote',
    swatch: ['oklch(0.975 0.01 95)', '#fff', 'oklch(0.66 0.19 35)'],
    theme: { accent: 'rose', primary: 'oklch(0.66 0.19 35)', radius: 22, mode: 'light', font: 'Outfit', surface: 'warm', motion: 'playful' },
  },
  {
    id: 'tecno',
    name: 'Tecno',
    description: 'Oscuro, verde neón, Space Grotesk',
    swatch: ['oklch(0.16 0.01 270)', 'oklch(0.2 0.012 270)', 'oklch(0.78 0.18 155)'],
    theme: { accent: 'emerald', primary: 'oklch(0.78 0.18 155)', radius: 10, mode: 'dark', font: 'Space Grotesk', surface: 'neutral', motion: 'normal' },
  },
]

export const accentColors: Record<string, string> = {
  violet: 'oklch(0.56 0.22 285)',
  blue: 'oklch(0.58 0.2 255)',
  emerald: 'oklch(0.6 0.15 160)',
  rose: 'oklch(0.6 0.21 15)',
  amber: 'oklch(0.7 0.16 65)',
}

/** npm package and CSS family for each font. */
export const fonts: Record<Theme['font'], { pkg: string; family: string }> = {
  Inter: { pkg: '@fontsource-variable/inter', family: 'Inter Variable' },
  Geist: { pkg: '@fontsource-variable/geist', family: 'Geist Variable' },
  'Plus Jakarta Sans': { pkg: '@fontsource-variable/plus-jakarta-sans', family: 'Plus Jakarta Sans Variable' },
  'DM Sans': { pkg: '@fontsource-variable/dm-sans', family: 'DM Sans Variable' },
  Manrope: { pkg: '@fontsource-variable/manrope', family: 'Manrope Variable' },
  'Space Grotesk': { pkg: '@fontsource-variable/space-grotesk', family: 'Space Grotesk Variable' },
  Outfit: { pkg: '@fontsource-variable/outfit', family: 'Outfit Variable' },
}

/** CSS custom properties a theme sets on :root (custom primary color and font). */
export function themeVars(theme: Theme): Record<string, string> {
  const vars: Record<string, string> = { '--radius': `${theme.radius}px`, '--pk-font': `'${fonts[theme.font].family}'` }
  if (theme.primary) {
    vars['--primary'] = theme.primary
    vars['--ring'] = `color-mix(in oklch, ${theme.primary} 45%, transparent)`
  }
  return vars
}
