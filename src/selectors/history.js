import { createSelector as memo } from 'reselect'

const past = ({ history }) =>
  history.past

const future = ({ history }) =>
  history.future

export const getUndo = ({ history }) =>
  history.future?.[0]?.undo

export const getRedo = ({ history }) =>
  history.past?.[0]?.redo

export const getHistory = memo([past, future],
  (past, future) => ({
    past: past.length,
    undo: past?.[0]?.redo?.type,
    future: future.length,
    redo: future?.[0]?.redo?.type
  })
)
