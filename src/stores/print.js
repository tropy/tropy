import { configureStore } from '@reduxjs/toolkit'
import { intl } from '../reducers/index.js'

export const create = () =>
  configureStore({
    reducer: {
      intl
    }
  })
