'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ProjectSidebar } = require('./project-sidebar')
const { Items } = require('./items')
const { PanelGroup } = require('./panelgroup')
const { Viewer } = require('./viewer')
const { noop } = require('../common/util')

const Project = ({ showContextMenu }) => (
  <div id="project" onContextMenu={showContextMenu}>
    <div id="project-view">
      <ProjectSidebar/>
      <main>
        <Items/>
      </main>
    </div>
    <section id="item">
      <PanelGroup/>
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
      showContextMenu() {
        dispatch({
          type: 'context:show',
          meta: { ipc: true }
        })
      }
    })
  )(Project)
}
