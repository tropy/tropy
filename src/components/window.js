import React from 'react'
import { noop } from '../common/util'

export const WindowContext = React.createContext({
  maximize: noop
})
