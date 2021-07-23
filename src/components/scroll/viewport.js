import React from 'react'
import cx from 'classnames'
import { element, number, object, oneOfType, string } from 'prop-types'

export const Viewport = ({ children, className, columns, tag, transform }) =>
  React.createElement(tag, {
    className: cx('viewport', className),
    style: {
      gridTemplateColumns: columns ? `repeat(${columns}, ${columns}fr)` : null,
      transform
    }
  }, children)

Viewport.propTypes = {
  children: element,
  className: oneOfType(string, object),
  columns: number,
  tag: string.isRequired,
  transform: string
}

Viewport.defaultProps = {
  tag: 'ul'
}
