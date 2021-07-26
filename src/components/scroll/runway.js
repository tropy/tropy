import React from 'react'
import cx from 'classnames'
import { element, number, object, oneOfType, string } from 'prop-types'

export const Runway = ({ children, className, height }) => (
  <div className={cx('runway', className)} style={{ height }}>
    {children}
  </div>
)

Runway.propTypes = {
  children: element,
  className: oneOfType(string, object),
  height: number.isRequired
}
