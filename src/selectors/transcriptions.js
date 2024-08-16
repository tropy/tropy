export const getActiveTranscriptionId = (state) => {
  let { photo, selection } = state.nav

  let parent = selection != null ?
    state.selections[selection] :
    state.photos[photo]

  return parent?.transcriptions.at(-1)
}

export const getActiveTranscription = (state) =>
  state.transcriptions[getActiveTranscriptionId(state)]

