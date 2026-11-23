/*
 * Nav cursor and cursor paths:
 * item > photo (or photo selection) > note.
 *
 * The nav cursor is the current cursor path,
 * based on current nav.selection's cursors.
 * An item has many cursor paths.
 *
 * Selecting proposes a path, often partial.
 * The select creators check the levels given against the data
 * and pass the item's paths, as the nav reducer does not see
 * the items, photos and notes. The reducer completes the path
 * to the default cursor path: the current photo and note
 * where they fit, else the first photo and its first note.
 */

// Checks a (partial) cursor path top-down.
export function checkCursorPath (state, {
  item,
  photo,
  selection,
  note
}) {
  if (photo != null && !state.items[item]?.photos.includes(photo))
    throw new Error(`photo ${photo} is not in item ${item}`)

  if (selection != null && state.selections[selection]?.photo !== photo)
    throw new Error(`selection ${selection} is not in photo ${photo}`)

  if (note != null && !selectNoteIds(state, selection ?? photo)?.includes(note))
    throw new Error(`note ${note} is not in ${selection ?? photo}`)
}

export const selectNoteIds = (state, id) =>
  (state.selections[id] ?? state.photos[id])?.notes

export function selectCursorPaths (state, id) {
  let photos = state.items[id]?.photos ?? []
  let notes = {}

  for (let photo of photos) {
    notes[photo] = state.photos[photo]?.notes ?? []

    for (let selection of state.photos[photo]?.selections ?? [])
      notes[selection] = state.selections[selection]?.notes ?? []
  }

  return { photos, notes }
}
