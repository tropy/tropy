'use strict'

const React = require('react')

const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { Button } = require('./button')
const { Tabs } = require('./tabs')
const { Tab } = require('./tabs')
const { NoteList } = require('./notelist')
const { Dl, Dt, Dd } = require('./dl')


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
          </Tab> <Tab>
            <IconTag/>
            Tags
          </Tab>
        </Tabs>
      </header>
      <div className="panel-body">
        <Dl>
          <Dt>Publisher</Dt>
          <Dd>Manuscript Division, Library of Congress, Washington, D.C.</Dd>
          <Dt>Source</Dt>
          <Dd>Pinkerton’s National Detective Agency Records</Dd>
          <Dt>Rights</Dt>
          <Dd>
            <a href="#">http://findingaids.loc.gov/db/search/xq/searchMfer02.xq?
              _id=loc.mss.eadmss.ms003007&_faSection=usingThisCollection&_faSubs
              ection=userestrict&_dmdid=d5489e15
            </a>
          </Dd>
          <Dt>Box</Dt>
          <Dd>27</Dd>
          <Dt>Folder</Dt>
          <Dd/>
          <Dt>Date</Dt>
          <Dd>1899-12-24</Dd>
          <Dt>Creator</Dt>
          <Dd/>
          <Dt>Type</Dt>
          <Dd>Correspondence</Dd>
          <Dt>Title</Dt>
          <Dd>Denver to Chicago</Dd>
          <Dt>Recipient</Dt>
          <Dd/>
          <Dt>Description</Dt>
          <Dd/>
        </Dl>
      </div>
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
