import { createSelector as memo } from 'reselect'

export const getNotePadState = memo(
  ({ notepad }) => notepad,
  ({ nav }) => nav.note,
  (notepad, id) => notepad[id] || {}
)
