'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { ProjectSidebar } = require('./project/sidebar')
const { Resizable } = require('./resizable')
const { Item, Items } = require('./items')
const { noop } = require('../common/util')
const { context } = require('../actions/ui')
const { frameless } = ARGS

const Project = ({ showContextMenu }) => (
  <div id="project" onContextMenu={showContextMenu}>
    <div id="project-view">
      <Resizable edge="right" value={250}>
        <ProjectSidebar hasToolbar={frameless}/>
      </Resizable>
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
