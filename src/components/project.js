'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ProjectSidebar } = require('./project/sidebar')
const { Toolbar } = require('./toolbar')
const { Tab, Tabs } = require('./tabs')
const { NoteList } = require('./notelist')
const { Items } = require('./items')
const { PanelGroup, Panel } = require('./panel')
const { Viewer } = require('./viewer')
const { noop } = require('../common/util')
const { context } = require('../actions/ui')

const {
  IconPhoto, IconMetadata, IconNote, IconTag, IconPlus
} = require('./icons')


const sidebarWidth = { width: '250px' }
const panelWidth = { width: '320px' }

const Project = ({ showContextMenu }) => (
  <div id="project" onContextMenu={showContextMenu}>
    <div id="project-view">
      <div className="resizable" style={sidebarWidth}>
        <ProjectSidebar toolbar={ARGS.frameless}/>
        <div className="resizable-handle-col resizable-handle-right"/>
      </div>
      <main>
        <Items/>
      </main>
    </div>
    <section id="item">
      <div className="resizable" style={panelWidth}>
        <PanelGroup header={
          <Toolbar draggable/>
        }>

          <Panel header={
            <Tabs justified>
              <Tab active><IconMetadata/>Metadata</Tab>
              <Tab><IconTag/>Tags</Tab>
            </Tabs>
          }>
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
          </Panel>

          <Panel header={
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
          }>
            <ul className="photo-list">
              <li className="photo active">
                <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
                  width={24} height={24} className="thumbnail"/>
                <div className="file-name">PC110098.JPG</div>
              </li>
              <li className="photo">
                <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
                  width={24} height={24} className="thumbnail"/>
                <div className="file-name">PC110099.JPG</div>
              </li>
            </ul>
          </Panel>

          <Panel header={
            <Toolbar>
              <div className="toolbar-left">
                <IconNote/><h4>Notes</h4>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-icon"><IconPlus/></button>
              </div>
            </Toolbar>
          }>
            <NoteList/>
          </Panel>

        </PanelGroup>
        <div className="resizable-handle-col resizable-handle-left"/>
      </div>
      <Viewer/>
    </section>
  </div>
)

Project.propTypes = {
  showContextMenu: PropTypes.func
}

Project.defaultProps = {
  showContextMenu: noop
}

module.exports = {
  Project: connect(
    null,
    dispatch => ({
      showContextMenu(event) {
        dispatch(context.show(event))
      }
    })
  )(Project)
}
