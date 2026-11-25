export const getNoteParent = ({ notes, photos, selections }, { id }) => {
  let { photo, selection } = notes[id]

  if (photo == null) {
    photo = selections[selection].photo
  }

  let { item } = photos[photo]

  return { item, photo, selection }
}

export const getNotesMap = (state, props) =>
  props.notes.reduce((nmap, noteId) => {
    let { photo, selection } = state.notes[noteId]

    let id = (selection != null) ? selection : photo
    let type = (selection != null) ? 'selection' : 'photo'

    if (nmap.has(id))
      nmap.get(id).notes.push(noteId)
    else
      nmap.set(id, {
        id,
        type,
        notes: [noteId]
      })

    return nmap

  }, new Map)
