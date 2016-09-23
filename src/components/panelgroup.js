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
    <header className="panel-group-header">
      <Toolbar draggable/>
    </header>
    <div className="resizable-container">
      <Panel>
        <header className="panel-header">
          <Tabs justified>
            <Tab active>
              <IconMetadata/>
              Metadata
            </Tab> <Tab>
              <IconTag/>
              Tags
            </Tab>
          </Tabs>
        </header>
        <div className="panel-body">
          <dl className="dl-horizontal">
            <dt>Publisher</dt>
            <dd>Manuscript Division, Library of Congress, Washington, D.C.</dd>
            <dt>Source</dt>
            <dd>Pinkerton’s National Detective Agency Records</dd>
            <dt>Rights</dt>
            <dd>
              <a href="#">http://findingaids.loc.gov/db/search/xq/searchMfer02.x
                q?_id=loc.mss.eadmss.ms003007&_faSection=usingThisCollection&_fa
                Subsection=userestrict&_dmdid=d5489e15
              </a>
            </dd>
            <dt>Box</dt>
            <dd>27</dd>
            <dt>Folder</dt>
            <dd/>
            <dt>Date</dt>
            <dd>1899-12-24</dd>
            <dt>Creator</dt>
            <dd/>
            <dt>Type</dt>
            <dd>Correspondence</dd>
            <dt>Title</dt>
            <dd>Denver to Chicago</dd>
            <dt>Recipient</dt>
            <dd/>
            <dt>Description</dt>
            <dd/>
          </dl>
        </div>
        <div className="resizable-handle-row resizable-handle-bottom"/>
      </Panel>
      <Panel>
        <header className="panel-header">
          <Toolbar>
            <div className="toolbar-left">
              <IconPhoto/>
              <h4>Photos</h4>
            </div>
            <div className="toolbar-right"/>
          </Toolbar>
        </header>
        <div className="panel-body"/>
        <div className="resizable-handle-row resizable-handle-bottom"/>
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
      <div className="resizable-handle-col resizable-handle-left"/>
    </div>
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
