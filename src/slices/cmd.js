import { pick } from '../common/util.js'
import { createMetaReducer } from './util.js'

export const cmdReducer = (reducer, scope = 'project') =>
  createMetaReducer({ cmd: scope }, reducer)

// Matches all command triggers in scope.
export function commands (scope) {
  return ({ error, meta }) => (
    !error && meta && !meta.done && meta.cmd === scope
  )
}

const matches = (types, type) =>
  types.length === 0 || types.includes(type)

export function isPending (...types) {
  return ({ type, error, meta }) => (
    !error && meta?.cmd != null && !meta.done && matches(types, type)
  )
}

export function isDone (...types) {
  return ({ type, error, meta }) => (
    !error && !!meta?.done && matches(types, type)
  )
}

export function hasFailed (...types) {
  return ({ type, error, meta }) => (
    !!error && !!meta?.done && matches(types, type)
  )
}

export function isResultOf (action) {
  return ({ type, meta }) => (
    type === action.type && !!meta?.done && meta.rel === action.meta.seq
  )
}

// The 'done' action creator for a long running effect,
// like a Command execution.
export function done (action, result, meta) {
  let error = result instanceof Error
  let payload = !error ?
    result :
    pick(result, ['code', 'message', 'stack', 'type'])

  return {
    type: action.type,
    payload,
    error,
    meta: {
      agent: action.meta.agent,
      hidden: action.meta.hidden,
      history: action.meta.history,
      idx: action.meta.idx,
      ipc: action.meta.ipc,
      log: action.meta.log,
      rsvp: action.meta.rsvp,
      search: action.meta.search,
      ...meta,
      done: true,
      rel: action.meta.seq,
      was: action.meta.now
    }
  }
}

// Matches all done actions.
done.match = ({ meta }) => !!meta?.done
