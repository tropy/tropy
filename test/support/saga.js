import { mock } from 'node:test'

// Steps through a saga without running its effects.
// Select effects are resolved against `state`.
// Call effects are answered by node:test mocks:
// the implementations in `mocks` (Map or [fn, impl] pairs),
// or, for all other functions, mocks returning undefined.
// Errors thrown by a mock are thrown into the saga.
// Put effects are recorded in `puts`.

export function run (saga, { state = {}, mocks = [] } = {}) {
  mocks = new Map(mocks)
  let fns = new Map()
  let puts = []

  let mockFor = (fn) => {
    if (!fns.has(fn))
      fns.set(fn, mock.fn(mocks.get(fn)))
    return fns.get(fn)
  }

  let next = saga.next()

  while (!next.done) {
    let { type, payload } = next.value
    let value

    switch (type) {
      case 'SELECT':
        value = payload.selector(state, ...payload.args)
        break
      case 'CALL':
        try {
          value = mockFor(payload.fn)(...payload.args)
        } catch (err) {
          next = saga.throw(err)
          continue
        }
        break
      case 'PUT':
        puts.push(payload.action)
        value = payload.action
        break
      default:
        throw new Error(`unsupported effect: ${type}`)
    }

    next = saga.next(value)
  }

  return {
    calls: (fn) => mockFor(fn).mock,
    puts,
    result: next.value
  }
}
