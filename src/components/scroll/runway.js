import React from 'react'
import cx from 'classnames'
import { element, number, object, oneOfType, string } from 'prop-types'

export const Runway = ({ children, className, height, width }) => (
  <div className={cx('runway', className)} style={{ height, minWidth: width }}>
    {children}
  </div>
)

Runway.propTypes = {
  children: element,
  className: oneOfType(string, object),
  width: number,
  height: number.isRequired
}
