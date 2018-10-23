'use strict'

const { createSelector: memo } = require('reselect')

const getNotePadState = memo(
  ({ notepad }) => notepad,
  ({ nav }) => nav.note,
  (notepad, id) => notepad[id] || {}
)

module.exports = {
  getNotePadState
}
