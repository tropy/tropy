'use strict'

const React = require('react')
const { PropTypes, Children } = React

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


const PanelGroup = ({ header, children }) => {
  const panels = Children.toArray(children)
  const height = 100 / panels.length
  const last = panels.pop()

  return (
    <div id="panel-group">
      <header className="panel-group-header">
        {header}
      </header>
      <div className="panel-group-body">
        {panels.map((panel, idx) => (
          <div key={idx} className="resizable" style={{ height: `${height}%` }}>
            {panel}
            <div className="resizable-handle-row resizable-handle-bottom"/>
          </div>
        ))}
        {last}
      </div>
    </div>
  )
}

PanelGroup.propTypes = {
  header: PropTypes.node,
  children: PropTypes.node
}

module.exports = {
  Panel,
  PanelGroup
}
