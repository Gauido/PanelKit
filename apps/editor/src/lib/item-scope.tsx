import { createContext, useContext } from 'react'

/** The row a block is drawn for, inside a Lista repetida. Read as {{item.x}} / {{index}}. */
export type ItemScope = { item: Record<string, unknown>; index: number } | null
export const ItemContext = createContext<ItemScope>(null)
export const useItem = () => useContext(ItemContext)
