'use strict'

const React = require('react')
const { PropTypes } = React

const Icon = ({ children, name }) => (
  <span className={`icon icon-${name}`}>
    {children}
  </span>
)

Icon.propTypes = {
  children: PropTypes.element,
  name: PropTypes.string
}

module.exports = { Icon }


function i(name, svg) {
  const icon = () => (
    <Icon name={name.toLowerCase()}>{svg}</Icon>
  )

  icon.displayName = `Icon${name}`

  module.exports[icon.displayName] = icon
}

/* eslint-disable max-len */

i('Folder', (
  <svg width="16" height="16">
    <g className="line">
      <path d="M15,3H9L8.276,1.553C8.107,1.214,7.761,1,7.382,1H3.618C3.239,1,2.893,1.214,2.724,1.553L2,3H1C0.448,3,0,3.448,0,4v10c0,0.552,0.448,1,1,1h14c0.552,0,1-0.448,1-1V4C16,3.448,15.552,3,15,3z M15,14H1V6h14V14z M1,5V4h1c0.379,0,0.725-0.214,0.894-0.553L3.618,2h3.764v0l0.724,1.447C8.275,3.786,8.621,4,9,4h6v1H1z"/>
    </g>
    <g className="block">
      <path d="M15,15H1c-0.552,0-1-0.448-1-1V7c0-0.552,0.448-1,1-1h14c0.552,0,1,0.448,1,1v7C16,14.552,15.552,15,15,15z M16,5V4c0-0.552-0.448-1-1-1H9L8.276,1.553C8.107,1.214,7.761,1,7.382,1H3.618C3.239,1,2.893,1.214,2.724,1.553L2,3H1C0.448,3,0,3.448,0,4v1H16z"/>
    </g>
  </svg>
))

i('Plus', (
  <svg width="16" height="16">
    <g className="line">
      <polygon points="16,7 9,7 9,0 8,0 8,7 1,7 1,8 8,8 8,15 9,15 9,8 16,8 "/>
    </g>
  </svg>
))

i('Search', (
  <svg width="16" height="16">
    <g className="line">
      <path d="M15.824,14.977L11.5,10.652C12.436,9.526,13,8.079,13,6.5C13,2.91,10.09,0,6.5,0S0,2.91,0,6.5S2.91,13,6.5,13c1.579,0,3.026-0.564,4.152-1.5l4.324,4.324C15.094,15.941,15.247,16,15.4,16s0.307-0.059,0.424-0.176C16.059,15.591,16.059,15.21,15.824,14.977z M6.5,11.8c-2.922,0-5.3-2.378-5.3-5.3s2.378-5.3,5.3-5.3s5.3,2.378,5.3,5.3S9.422,11.8,6.5,11.8z"/>
    </g>
  </svg>
))



