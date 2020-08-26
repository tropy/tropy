import { createSelector as memo } from 'reselect'
import { get } from '../common/util'


const past = ({ history }) =>
  history.past

const future = ({ history }) =>
  history.future

export const undo = ({ history }) =>
  get(history.future, [0, 'undo'])

export const redo = ({ history }) =>
  get(history.past, [0, 'redo'])

export const summary = memo([past, future],
  (past, future) => ({
    past: past.length,
    undo: get(past, [0, 'redo', 'type']),
    future: future.length,
    redo: get(future, [0, 'redo', 'type'])
  })
)
