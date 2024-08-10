import React from 'react'

export const EsperView = React.forwardRef(({
  children
}, ref) => (
  <div className="esper-view-container">
    <div className="esper-view" ref={ref}/>
    {children}
  </div>
))
