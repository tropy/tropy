import React from 'react'
import { element, object, oneOfType, string } from 'prop-types'
import cx from 'classnames'

const ScrollContainer = React.forwardRef(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cx('scroll-container', className)} {...props}>
      {children}
    </div>
  ))

ScrollContainer.propTypes = {
  children: element,
  className: oneOfType(object, string)
}

export {
  ScrollContainer
}
