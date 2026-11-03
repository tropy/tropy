import { createSlice } from '@reduxjs/toolkit'
import { NAV } from '../constants/index.js'

const qr = createSlice({
  name: 'qr',
  initialState: {
    items: [],
    matches: null,
    order: [],
    sort: null
  },

  reducers: {
    update: {
      prepare: (payload = {}, meta) => ({
        payload,
        meta: { log: 'debug', ...meta }
      }),

      reducer: (state, { payload }) => ({
        ...state,
        ...payload
      })
    }
  }
})

export const {
  update
} = qr.actions

export const selectItemSequence = (state) =>
  state.qr.items

export const selectSortKey = ({ items, metadata, ontology }, column) => {
  switch (column) {
    case NAV.COLUMN.CREATED.id:
      return (id) => items[id]?.created?.getTime()
    case NAV.COLUMN.MODIFIED.id:
      return (id) => items[id]?.modified?.getTime()
    case NAV.COLUMN.TEMPLATE.id:
      return (id) => ontology.template[items[id]?.template]?.name
    default:
      return (id) => metadata[id]?.[column]?.text
  }
}

export default qr.reducer
