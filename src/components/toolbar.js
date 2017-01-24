'use strict'

const React = require('react')
const { PropTypes } = React
const { noop } = require('../common/util')
const cn = require('classnames')

const ToolGroup = ({ children }) => (
  <div className="tool-group">{children}</div>
)

ToolGroup.propTypes = {
  children: PropTypes.node
}

const Toolbar = ({ children, draggable, onMaximize }) => (
  <div
    className={cn({ toolbar: true,  draggable })}
    onDoubleClick={draggable ? onMaximize : noop}>
    {children}
  </div>
)

Toolbar.propTypes = {
  children: PropTypes.node,
  draggable: PropTypes.bool,
  onMaximize: PropTypes.func
}


module.exports = {
  Toolbar,
  ToolGroup
}
