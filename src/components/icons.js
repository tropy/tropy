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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <g className="line">
        <path className="fill" d="M15,3H9L8.276,1.553C8.107,1.214,7.761,1,7.382,1H3.618C3.239,1,2.893,1.214,2.724,1.553L2,3H1C0.448,3,0,3.448,0,4v10c0,0.552,0.448,1,1,1h14c0.552,0,1-0.448,1-1V4C16,3.448,15.552,3,15,3z M15,14H1V6h14V14z M1,5V4h1c0.379,0,0.725-0.214,0.894-0.553L3.618,2h3.764v0l0.724,1.447C8.275,3.786,8.621,4,9,4h6v1H1z"/>
      </g>
      <g className="block">
        <path className="fill" d="M15,15H1c-0.552,0-1-0.448-1-1V7c0-0.552,0.448-1,1-1h14c0.552,0,1,0.448,1,1v7C16,14.552,15.552,15,15,15z M16,5V4c0-0.552-0.448-1-1-1H9L8.276,1.553C8.107,1.214,7.761,1,7.382,1H3.618C3.239,1,2.893,1.214,2.724,1.553L2,3H1C0.448,3,0,3.448,0,4v1H16z"/>
      </g>
    </svg>
  ))
}
