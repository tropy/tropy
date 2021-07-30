import React from 'react'
import { element, number } from 'prop-types'

export const Runway = ({ children, height }) => (
  <div className="runway" style={{ height }}>
    {children}
  </div>
)

Runway.propTypes = {
  children: element,
  height: number.isRequired
}
