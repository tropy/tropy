'use strict'

const React = require('react')

const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { Button } = require('./button')
const { IconPlus } = require('./icons')
const { IconNote } = require('./icons')

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
      <header className="panel-header">
        <Toolbar>
          <div className="toolbar-left">
            <h4>Photos</h4>
          </div>
          <div className="toolbar-right">
            Slider
          </div>
        </Toolbar>
      </header>
      <div className="panel-body">Panel body</div>
    </Panel>
    <Panel>
      <header className="panel-header">
        <Toolbar>
          <div className="toolbar-left">
            <IconNote/>
            <h4>
              Notes
            </h4>
          </div>
          <div className="toolbar-right">
            <Button classes={'btn btn-icon'}>
              <IconPlus/>
            </Button>
          </div>
        </Toolbar>
      </header>
      <div className="panel-body"></div>
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