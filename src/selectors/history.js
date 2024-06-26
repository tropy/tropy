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
  (p, f) => ({
    past: p.length,
    undo: p[0]?.redo?.type,
    future: f.length,
    redo: f[0]?.redo?.type
  })
)
