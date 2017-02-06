'use strict'

const React = require('react')
const { node, bool, func } = React.PropTypes
const { noop } = require('../common/util')
const cn = require('classnames')

const ToolGroup = ({ children }) => (
  <div className="tool-group">{children}</div>
)

ToolGroup.propTypes = {
  children: node
}

const Toolbar = ({ children, draggable, onMaximize }) => (
  <div
    className={cn({ toolbar: true,  draggable })}
    onDoubleClick={draggable ? onMaximize : noop}>
    {children}
  </div>
)

Toolbar.propTypes = {
  children: node,
  draggable: bool,
  onMaximize: func
}

Toolbar.defaultProps = {
  onMaximize: noop
}


module.exports = {
  Toolbar,
  ToolGroup
}
