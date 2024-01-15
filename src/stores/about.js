import { configureStore } from '@reduxjs/toolkit'
import { flash, intl } from '../reducers/index.js'

export const create = () =>
  configureStore({
    reducer: {
      flash,
      intl
    }
  })
