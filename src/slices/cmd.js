import { pick } from '../common/util.js'
import { createMetaReducer } from './util.js'

// Prepares actions that trigger a command in the given scope.
export const cmdReducer = (reducer, scope = 'project') =>
  createMetaReducer({ cmd: scope }, reducer)

// Matches actions that trigger a command in the given scope.
export function commands (scope) {
  return ({ error, meta }) => (
    !error && meta && !meta.done && meta.cmd === scope
  )
}

// Creates the 'done' action for a long running effect,
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
