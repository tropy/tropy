import { createAction } from '@reduxjs/toolkit'

export const restore = createAction('nav/restore')

// Shows a view: { view, query, tags }.
// This is basically a click in the project sidebar.
export const show = createAction('nav/show', (payload, meta) => ({
  payload,
  meta: {
    log: 'trace',
    history: true,
    search: true,
    ...meta
  }
}))
