import React from 'react'

export const Viewport = ({
  children,
  columns,
  offset = 0,
  tag = 'ul'
}) =>
  React.createElement(tag, {
    className: 'viewport',
    style: {
      gridTemplateColumns: columns ? `repeat(${columns}, ${columns}fr)` : null,
      transform: `translate3d(0,${offset}px,0)`
    }
  }, children)
