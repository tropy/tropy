'use strict'

const React = require('react')

const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { Button } = require('./button')
const { Tabs } = require('./tabs')
const { Tab } = require('./tabs')
const { NoteList } = require('./notelist')

const { IconPlus } = require('./icons')
const { IconPhoto } = require('./icons')
const { IconNote } = require('./icons')
const { IconMetadata } = require('./icons')
const { IconTag } = require('./icons')

const PanelGroup = () => (
  <div id="panel-group">
    <header>
      <Toolbar draggable/>
    </header>
    <Panel>
      <header className="panel-header">
        <Tabs justified>
          <Tab active>
            <IconMetadata/>
            Metadata
          </Tab>
          <Tab>
            <IconTag/>
            Tags
          </Tab>
        </Tabs>
      </header>
      <div className="panel-body"></div>
    </Panel>
    <Panel>
      <header className="panel-header">
        <Toolbar>
          <div className="toolbar-left">
            <IconPhoto/>
            <h4>Photos</h4>
          </div>
          <div className="toolbar-right">
          </div>
        </Toolbar>
      </header>
      <div className="panel-body"></div>
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
      <div className="panel-body">
        <NoteList/>
      </div>
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