import { describe, expect, it } from 'vitest'
import { fromExpr, toExpr, type Condition } from '../apps/editor/src/lib/condition'
import { whenText } from '../packages/blocks/src/lib/state'

describe('conditions built from lists', () => {
  const cases: [Condition, Record<string, unknown>, boolean][] = [
    [{ left: 'item.stage', op: 'eq', value: 'Cliente' }, { item: { stage: 'Cliente' } }, true],
    [{ left: 'state.turno.status', op: 'ne', value: 'Pagada' }, { state: {} }, true],
    [{ left: 'state.q', op: 'contains', value: 'Ana' }, { state: { q: 'hola ana' } }, true],
    [{ left: 'state.turno', op: 'empty', value: '' }, { state: {} }, true],
    [{ left: 'state.turno', op: 'filled', value: '' }, { state: {} }, false],
    [{ left: 'item.amount', op: 'gt', value: '100' }, { item: { amount: 150 } }, true],
    [{ left: 'item.amount', op: 'lt', value: '100' }, { item: { amount: 150 } }, false],
    [{ left: 'state.n', op: 'eq', value: '3' }, { state: { n: 3 } }, true],
  ]
  it('round-trips and evaluates', () => {
    for (const [c, scope, expected] of cases) {
      const expr = toExpr(c)
      expect(fromExpr(expr)).toEqual(c)
      expect(whenText(expr, { state: {}, item: {}, ...scope })).toBe(expected)
    }
  })
  it('treats hand-written code as advanced', () => {
    expect(fromExpr('state.a && state.b')).toBeNull()
    expect(fromExpr("item.stage === 'Cliente'")).toEqual({ left: 'item.stage', op: 'eq', value: 'Cliente' })
  })
})
