'use strict'

const React = require('react')

const { PropTypes } = React
const { Toolbar } = require('./toolbar')

const PanelGroup = () => (
  <div id="panel-group">
    <header>
      <Toolbar draggable/>
    </header>
    <Panel>
      <header className="panel-header">Panel header</header>
      <div className="panel-body">Panel body</div>
    </Panel>
    <Panel>
      <header className="panel-header">Panel header</header>
      <div className="panel-body">Panel body</div>
    </Panel>
    <Panel>
      <header className="panel-header">Panel header</header>
      <div className="panel-body">Panel body</div>
    </Panel>
  </div>
)


const Panel = ({ children }) => (
  <section className="panel">{children}</section>
)

Panel.propTypes = {
  children: PropTypes.node
}

module.exports = {
  PanelGroup, Panel
}