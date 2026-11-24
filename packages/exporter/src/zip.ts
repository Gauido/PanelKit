import JSZip from 'jszip'
import type { GeneratedFiles } from './generate'

export async function toZip(files: GeneratedFiles, folder: string): Promise<Blob> {
  const zip = new JSZip()
  const root = zip.folder(folder)!
  for (const [path, content] of Object.entries(files)) root.file(path, content)
  return zip.generateAsync({ type: 'blob' })
}
