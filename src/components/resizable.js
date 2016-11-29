'use strict'

const React = require('react')
const { PropTypes } = React
const T = require('./types')
const cn = require('classnames')

const ResizableHandle = ({ orientation }) => (
  <div className={cn([
    'resizable-handle-col',
    `resizable-handle-${orientation}`
  ])}/>
)

ResizableHandle.propTypes = {
  orientation: T.orientation.isRequired
}


const Resizable = ({ width, children, ...props }) => (
  <div className="resizable" style={{ width: `${width}px` }}>
    {children}
    <ResizableHandle {...props}/>
  </div>
)

Resizable.propTypes = {
  children: PropTypes.node,
  orientation: T.orientation.isRequired,
  width: PropTypes.number.isRequired
}

module.exports = {
  Resizable,
  ResizableHandle
}
