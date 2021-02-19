import React from 'react'
import { element } from 'prop-types'

const ScrollContainer = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="scroll-container" {...props}>
    {children}
  </div>
))

ScrollContainer.propTypes = {
  children: element
}

export {
  ScrollContainer
}
