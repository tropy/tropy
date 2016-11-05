'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ProjectSidebar } = require('./project/sidebar')
const { Item, Items } = require('./items')
const { noop } = require('../common/util')
const { context } = require('../actions/ui')
const { frameless } = ARGS

const Project = ({ showContextMenu }) => (
  <div id="project" onContextMenu={showContextMenu}>
    <div id="project-view">
      <div className="resizable" style={{ width: '250px' }}>
        <ProjectSidebar toolbar={frameless}/>
        <div className="resizable-handle-col resizable-handle-right"/>
      </div>
      <main>
        <Items/>
      </main>
    </div>
    <Item/>
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
