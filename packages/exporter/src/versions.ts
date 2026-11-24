/** Dependency versions written into exported repos. Kept in sync with the workspace. */
export const runtimeDeps: Record<string, string> = {
  '@fontsource-variable/inter': '^5.3.0',
  '@tanstack/react-query': '^5.108.4',
  clsx: '^2.1.1',
  'lucide-react': '^1.79.0',
  motion: '^14.14.0',
  react: '^19.3.1',
  'react-dom': '^19.3.1',
  'react-router': '^8.5.3',
  'tailwind-merge': '^3.7.1',
}

export const devDeps: Record<string, string> = {
  '@tailwindcss/vite': '^4.3.5',
  '@types/react': '^19.3.1',
  '@types/react-dom': '^19.3.0',
  '@vitejs/plugin-react': '^6.3.0',
  tailwindcss: '^4.3.5',
  typescript: '^5.9.3',
  vite: '^8.3.8',
}
