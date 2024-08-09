import React from 'react'
import { EsperError } from './error.js'

export const EsperView = React.forwardRef(({
  children,
  isTextureMissing = false,
  photoId
}, ref) => (
  <div className="esper-view-container">
    <div className="esper-view" ref={ref}/>
    {isTextureMissing && <EsperError photoId={photoId}/>}
    {children}
  </div>
))
