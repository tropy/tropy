import React from 'react'
import cx from 'classnames'
import { element, object, oneOfType, string } from 'prop-types'

export const Viewport = ({ children, className, transform }) => (
  <div className={cx('viewport', className)} style={{ transform }}>
    {children}
  </div>
)

Viewport.propTypes = {
  children: element,
  className: oneOfType(string, object),
  transform: string
}
