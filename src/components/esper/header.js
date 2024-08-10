import React from 'react'
import { Titlebar } from '../toolbar.js'

export const EsperHeader = ({ children }) => (
  <header className="esper-header">
    <Titlebar>
      {children}
    </Titlebar>
  </header>
)
