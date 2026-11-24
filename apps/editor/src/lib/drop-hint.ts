import { create } from 'zustand'

/** Where the block being dragged would land right now. Drives the indicator on the canvas. */
export type DropZone = 'before' | 'after' | 'inside'
export const useDropHint = create<{ id: string | null; zone: DropZone | null; set: (id: string | null, zone: DropZone | null) => void }>((set) => ({
  id: null,
  zone: null,
  set: (id, zone) => set({ id, zone }),
}))
