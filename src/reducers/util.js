import { array, omit, splice } from '../common/util'
import { into, map } from 'transducers.js'

export function load(state, payload, meta, error) {
  if (error) return state
  if (meta.done) return replace(state, payload)
  return pending(state, payload)
}

export function replace(state, payload) {
  return { ...state, ...payload }
}

export function insert(state, payload) {
  return update(state, payload, { replace: true })
}

export function remove(state, payload) {
  return omit(state, payload)
}

export function merge(state, payload) {
  return into({ ...state }, map(([id, data]) => ({
    [id]: { ...state[id], ...data }
  })), payload)
}

export function update(state, payload, meta = {}) {
  if (!Array.isArray(payload)) payload = [payload]
  for (let data of payload) {
    state = {
      ...state,
      [data.id]: meta.replace ?
        data : { ...state[data.id], ...data }
    }
  }
  return state
}

export function touch(state, payload, meta, error) {
  if (!meta.done || error) return state

  let dirty = false
  let modified = {}

  for (let id of payload) {
    const current = state[id]
    if (current == null) continue

    dirty = true
    modified[id] = { ...current, modified: new Date(meta.was) }
  }

  return dirty ? { ...state, ...modified } : state
}

export const nested = {
  add(name, state = {}, payload, { idx } = {}) {
    if (Array.isArray(idx)) idx = idx[0]

    return into({ ...state }, map(id => ({
      [id]: {
        ...state[id],
        [name]: splice(state[id][name], idx, 0, ...payload[name])
      }
    })), array(payload.id))
  },

  remove(name, state = {}, payload) {
    return into({ ...state }, map(id => ({
      [id]: {
        ...state[id],
        [name]: state[id][name].filter(x =>
          !payload[name].includes(x.id != null ? x.id : x))
      }
    })), array(payload.id))
  }
}

export const bulk = {
  update(state, payload, meta = {}) {
    if (!Array.isArray(payload)) return merge(state, payload)
    let [ids, data] = payload

    return into({ ...state }, map(id => ({
      [id]: meta.replace ? data : { ...state[id], ...data }
    })), ids)
  },

  remove(state, payload) {
    let [ids, props] = payload

    return into({ ...state },
      map(id => ({ [id]: omit(state[id], array(props)) })), ids)
  }
}

export function pending(state, payload) {
  if (payload == null || payload.length === 0) return state

  return into(
    { ...state },
    map(id => ({ [id]: { id, pending: true } })),
    payload
  )
}
