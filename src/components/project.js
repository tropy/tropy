'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ProjectSidebar } = require('./project/sidebar')
const { Items } = require('./items')
const { PanelGroup } = require('./panelgroup')
const { Viewer } = require('./viewer')
const { noop } = require('../common/util')
const { context } = require('../actions/ui')

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
        <PanelGroup/>
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
