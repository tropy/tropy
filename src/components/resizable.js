'use strict'

const React = require('react')
const { PropTypes } = React
const { Shapes } = require('./util')
const cn = require('classnames')

const ResizableHandle = ({ edge }) => (
  <div className={cn([
    'resizable-handle-col',
    `resizable-handle-${edge}`
  ])}/>
)

ResizableHandle.propTypes = {
  edge: Shapes.edge.isRequired
}


const Resizable = ({ width, children, ...props }) => (
  <div className="resizable" style={{ width: `${width}px` }}>
    {children}
    <ResizableHandle {...props}/>
  </div>
)

Resizable.propTypes = {
  children: PropTypes.node,
  edge: Shapes.edge.isRequired,
  width: PropTypes.number.isRequired
}

module.exports = {
  Resizable,
  ResizableHandle
}
