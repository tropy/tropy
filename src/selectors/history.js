'use strict'

const { createSelector: memo } = require('reselect')
const { get } = require('../common/util')


const past = ({ history }) =>
  history.past

const future = ({ history }) =>
  history.future

const undo = ({ history }) =>
  get(history.future, [0, 'undo'])

const redo = ({ history }) =>
  get(history.past, [0, 'redo'])

const summary = memo([past, future],
  (past, future) => ({
    past: past.length,
    undo: get(past, [0, 'redo', 'type']),
    future: future.length,
    redo: get(future, [0, 'redo', 'type'])
  })
)

module.exports = {
  undo,
  redo,
  summary
}
