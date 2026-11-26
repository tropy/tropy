import {
  createAction,
  createNextState,
  createSelector,
  createSlice
} from '@reduxjs/toolkit'
import { cmdReducer } from './cmd.js'
import { PROJECT } from '../constants/index.js'
import { Cursor } from '../common/sequence.js'


const transcriptions = createSlice({
  name: 'transcriptions',
  initialState: {},

  reducers: {
    activate: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        Object.assign(state, payload)
    }),

    create: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        Object.assign(state, payload)
    }),

    insert (state, { payload }) {
      for (let tr of payload) {
        state[tr.id] = tr
      }
    },

    load: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        Object.assign(state, payload)
    }),

    remove: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        for (let { id } of payload) delete state[id]
    }),

    restore: cmdReducer((state, { payload, meta, error }) => {
      if (meta.done && !error)
        for (let tr of payload) state[tr.id] = tr
    }),

    export: cmdReducer(() => {}),

    update (state, { payload }) {
      let { id, ...props } = payload
      Object.assign(state[id], props)
    }
  },

  extraReducers: (builder) => {
    builder.addCase(PROJECT.HYDRATE, (_, { payload }) =>
      payload.transcriptions)
  }
})

export const nested = {
  create (state, { payload, meta, error }) {
    return (!meta.done || error || payload == null) ?
      state : createNextState(state, draft => {
        for (let tr of Object.values(payload)) {
          draft[tr.parent]?.transcriptions.push(tr.id)
        }
        return draft
      })
  },

  remove (state, { payload, meta, error }) {
    return (!meta.done || error) ?
      state : createNextState(state, draft => {
        for (let tr of payload) {
          if (tr.idx >= 0 && tr.parent in draft)
            draft[tr.parent].transcriptions.splice(tr.idx, 1)
        }
        return draft
      })
  },

  restore (state, { payload, meta, error }) {
    return (!meta.done || error) ?
      state : createNextState(state, draft => {
        for (let tr of payload) {
          draft[tr.parent]?.transcriptions.splice(tr.idx, 0, tr.id)
        }
        return draft
      })
  }
}

// Handle for the activity of processing pending transcriptions,
// which uses our transcription service (cloud, see the activity status).
export const collect = createAction(
  'transcription.process',
  () => ({
    payload: undefined,
    meta: { cloud: true }
  }))

export const {
  activate,
  create,
  insert,
  load,
  remove,
  restore,
  update
} = transcriptions.actions

const exportAction = transcriptions.actions.export
export { exportAction as export }

export default transcriptions.reducer

// The transcription ids of a photo or selection.
export const selectTranscriptionIds = (state, id) =>
  (state.photos[id] ?? state.selections[id])?.transcriptions

export const selectTranscriptions = (state, id) =>
  selectTranscriptionIds(state, id)?.map(tr => state.transcriptions[tr])

// The active transcription is the most recently modified one.
export const activeTranscription = (transcriptions) =>
  transcriptions?.reduce((active, tr) =>
    (active == null || tr.modified >= active.modified) ? tr : active,
  undefined)

// The active transcription of a photo or selection.
export const selectActiveTranscription = (state, id) =>
  activeTranscription(selectTranscriptions(state, id))

// The transcription to activate when removing ids,
// if they include the active one.
export function selectTranscriptionSuccessor (state, ids) {
  let id = state.transcriptions[ids[0]]?.parent
  let active = selectActiveTranscription(state, id)?.id

  if (!ids.includes(active))
    return null

  let seq = selectTranscriptionIds(state, id)
    .filter(tr => tr === active || !ids.includes(tr))

  return new Cursor(seq, active).successor()
}

// Transcriptions waiting for our transcription service.
export const selectPendingTranscriptions = createSelector(
  (state) => state.transcriptions,
  (transcriptions) =>
    Object
      .values(transcriptions)
      .filter(tr => !tr.config?.plugin && tr.config?.jobId && tr.status === 0))

// The active transcriptions of an item's photos and selections,
// or null if there is no such item.
export const selectItemTranscriptions = (state, id) => {
  let item = state.items[id]

  if (item == null)
    return null

  let transcriptions = []

  for (let pid of item.photos) {
    let tr = selectActiveTranscription(state, pid)
    if (tr) transcriptions.push(tr)

    for (let sid of state.photos[pid].selections) {
      tr = selectActiveTranscription(state, sid)
      if (tr) transcriptions.push(tr)
    }
  }

  return transcriptions
}
