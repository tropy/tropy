import { createSelector } from '@reduxjs/toolkit'

export const getTranscriptionIds = (state, { id }) =>
  (state.photos[id] ?? state.selections[id])?.transcriptions

export const getTranscriptions = (state, props) =>
  getTranscriptionIds(state, props)?.map(id => state.transcriptions[id])

// The active transcription is the most recently modified one
export const getActiveTranscription = (state, props) =>
  getTranscriptions(state, {
    id: props?.id ?? state.nav.selection ?? state.nav.photo
  })?.reduce((active, tr) =>
    (active == null || tr.modified >= active.modified) ? tr : active,
  undefined)

export const getPendingTranscriptions = createSelector(
  (state) => state.transcriptions,
  (transcriptions) =>
    Object
      .values(transcriptions)
      .filter(tr => !tr.config?.plugin && tr.config?.jobId && tr.status === 0))

export const getItemTranscriptions = (state, props) => {
  let transcriptions = []

  for (let pid of state.items[props.id].photos) {
    let tr = getActiveTranscription(state, { id: pid })
    if (tr) transcriptions.push(tr)

    for (let sid of state.photos[pid].selections) {
      tr = getActiveTranscription(state, { id: sid })
      if (tr) transcriptions.push(tr)
    }
  }

  return transcriptions
}
