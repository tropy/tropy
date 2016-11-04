'use strict'

const React = require('react')

const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { Tabs } = require('./tabs')
const { Tab } = require('./tabs')
const { NoteList } = require('./notelist')


const { IconPlus } = require('./icons')
const { IconPhoto } = require('./icons')
const { IconNote } = require('./icons')
const { IconMetadata } = require('./icons')
const { IconTag } = require('./icons')

const panelHeight = { height: '33%' }

const PanelGroup = () => (
  <div id="panel-group">
    <header className="panel-group-header">
      <Toolbar draggable/>
    </header>
    <div className="panel-group-body">
      <div className="resizable" style={panelHeight}>
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
              <dd>
                Manuscript Division, Library of Congress, Washington, D.C.
              </dd>
              <dt>Source</dt>
              <dd>Pinkerton’s National Detective Agency Records</dd>
              <dt>Rights</dt>
              <dd>
                <a href="#">http://findingaids.loc.gov/db/search/xq/searchMfer02
                  .xq?_id=loc.mss.eadmss.ms003007&_faSection=usingThisCollection
                  &_faSubsection=userestrict&_dmdid=d5489e15
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
        </Panel>
        <div className="resizable-handle-row resizable-handle-bottom"/>
      </div>
      <div className="resizable" style={panelHeight}>
        <Panel>
          <header className="panel-header">
            <Toolbar>
              <div className="toolbar-left">
                <IconPhoto/>
                <h4>Photos</h4>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-icon">
                  <IconPlus/>
                </button>
              </div>
            </Toolbar>
          </header>
          <div className="panel-body"/>
        </Panel>
        <div className="resizable-handle-row resizable-handle-bottom"/>
      </div>
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
              <button className="btn btn-icon">
                <IconPlus/>
              </button>
            </div>
          </Toolbar>
        </header>
        <div className="panel-body">
          <NoteList/>
        </div>
      </Panel>
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
