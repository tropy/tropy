'use strict'

const React = require('react')
const cs = require('classnames')

const { PropTypes } = React

const Icon = ({ children, classes }) => (
  <span className={cs({ icon: true, ...classes })}>
    {children}
  </span>
)

Icon.propTypes = {
  children: PropTypes.element,
  classes: PropTypes.object
}


function i(name, svg) {
  const icon = ({ classes }) => (
    <Icon classes={{ [`icon-${name.toLowerCase()}`]: true, ...classes }}>
      {svg}
    </Icon>
  )

  icon.displayName = `Icon${name}`
  icon.propTypes = {
    classes: PropTypes.object
  }

  return icon
}


module.exports = {
  Icon,

  IconFolder: i('Folder', (
    <svg>
    </svg>
  ))
}
