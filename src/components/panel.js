'use strict'

const React = require('react')
const { PropTypes, Children } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')

const Panel = ({ header, children }) => (
  <section className="panel">
    <header className="panel-header">
      {header}
    </header>
    <div className="panel-body">
      {children}
    </div>
  </section>
)

Panel.propTypes = {
  children: PropTypes.node,
  header: PropTypes.node
}


const PanelGroup = ({ header, children, height }) => {
  const panels = Children.toArray(children)
  const last = panels.pop()

  return (
    <div id="panel-group">
      <header className="panel-group-header">
        {header}
      </header>
      <div className="panel-group-body">
        {panels.map((panel, idx) => (
          <Resizable key={idx} relative edge="bottom" value={height[idx]}>
            {panel}
          </Resizable>
        ))}
        {last}
      </div>
    </div>
  )
}

PanelGroup.propTypes = {
  header: PropTypes.node,
  height: PropTypes.arrayOf(PropTypes.number),
  children: only(Panel)
}

module.exports = {
  Panel,
  PanelGroup
}
