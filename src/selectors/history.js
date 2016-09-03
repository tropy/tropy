'use strict'

const {
  createSelector: memo
} = require('reselect')


const past = ({ history }) => history.past

const future = ({ history }) => history.future

const undone = ({ history }) =>
  history.future[0].undo

const redone = ({ history }) =>
  history.past[0].redo

const length = memo([past, future],
  (past, future) => ({
    past: past.length,
    future: future.length,
  })
)

module.exports = {
  undone,
  redone,
  length
}
