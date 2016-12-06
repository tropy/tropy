'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ProjectDropZone } = require('./project/drop-zone')
const { ProjectSidebar } = require('./project/sidebar')
const { Resizable } = require('./resizable')
const { Item, Items } = require('./items')
const actions = require('../actions')


const Project = ({ onContextMenu, onOpen }) => (
  <div id="project" onContextMenu={onContextMenu}>
    <ProjectDropZone onDrop={onOpen}>
      <div id="project-view">
        <Resizable edge="right" value={250}>
          <ProjectSidebar hasToolbar={ARGS.frameless}/>
        </Resizable>
        <main>
          <Items/>
        </main>
      </div>
      <Item/>
    </ProjectDropZone>
  </div>
)

Project.propTypes = {
  onContextMenu: PropTypes.func,
  onOpen: PropTypes.func
}

module.exports = {
  Project: connect(
    null,
    dispatch => ({
      onContextMenu(event) {
        dispatch(actions.ui.context.show(event))
      },

      onOpen(file) {
        dispatch(actions.project.open(file))
      }
    })
  )(Project)
}
