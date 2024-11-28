export const getTranscriptionIds = (state, { id }) =>
  (state.photos[id] ?? state.selections[id])?.transcriptions

export const getTranscriptions = (state, props) =>
  getTranscriptionIds(state, props)?.map(id => state.transcriptions[id])

const byModifiedDate = (a, b) => {
  if (a.modified < b.modified)
    return -1
  if (a.modifed > b.modified)
    return 1
  return 0
}

export const getActiveTranscription = (state, props) => {
  let transcriptions = getTranscriptions(state, {
    id: props?.id ?? state.nav.selection ?? state.nav.photo
  })

  return transcriptions?.sort(byModifiedDate).at(-1)
}
