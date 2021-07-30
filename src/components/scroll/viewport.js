import React from 'react'
import { element, number, string } from 'prop-types'

export const Viewport = ({ children, columns, tag, transform }) =>
  React.createElement(tag, {
    className: 'viewport',
    style: {
      gridTemplateColumns: columns ? `repeat(${columns}, ${columns}fr)` : null,
      transform
    }
  }, children)

Viewport.propTypes = {
  children: element,
  columns: number,
  tag: string.isRequired,
  transform: string
}

Viewport.defaultProps = {
  tag: 'ul'
}
