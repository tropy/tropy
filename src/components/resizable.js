'use strict'

const React = require('react')
const { PropTypes } = React
const { Shapes } = require('./util')
const cn = require('classnames')

const DIR = {
  top: 'row', right: 'col', bottom: 'row', left: 'col'
}

const DIM = {
  top: 'height', right: 'width', bottom: 'height', left: 'width'
}


const ResizableHandle = ({ edge }) => (
  <div className={cn([
    `resizable-handle-${DIR[edge]}`,
    `resizable-handle-${edge}`
  ])}/>
)

ResizableHandle.propTypes = {
  edge: Shapes.edge.isRequired
}


const Resizable = ({ value, children, edge, relative }) => (
  <div
    className="resizable"
    style={{ [DIM[edge]]: `${value}${relative ? '%' : 'px'}` }}>
    {children}
    <ResizableHandle edge={edge}/>
  </div>
)

Resizable.propTypes = {
  children: PropTypes.node,
  edge: Shapes.edge.isRequired,
  relative: PropTypes.bool,
  value: PropTypes.number.isRequired
}

module.exports = {
  Resizable,
  ResizableHandle
}
