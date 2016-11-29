'use strict'

const React = require('react')
const { PropTypes } = React
const cn = require('classnames')

const ToolGroup = ({ children }) => (
  <div className="tool-group">{children}</div>
)

ToolGroup.propTypes = {
  children: PropTypes.node
}

const Toolbar = ({ children, draggable }) => (
  <div className={cn({ toolbar: true,  draggable })}>
    {children}
  </div>
)

Toolbar.propTypes = {
  children: PropTypes.node,
  draggable: PropTypes.bool
}


module.exports = {
  Toolbar,
  ToolGroup
}
