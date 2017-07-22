'use strict'

const { createSelector: memo } = require('reselect')
const { get } = require('../common/util')


const past = ({ history }) =>
  history.past

const future = ({ history }) =>
  history.future

const undone = ({ history }) =>
  get(history.future, [0, 'undo'])

const redone = ({ history }) =>
  get(history.past, [0, 'redo'])

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
