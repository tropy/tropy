'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { ProjectDropZone } = require('./project/drop-zone')
const { ProjectSidebar } = require('./project/sidebar')
const { Resizable } = require('./resizable')
const { Item, Items } = require('./item')
const actions = require('../actions')


class Project extends Component {

  handleContextMenu = (event) => {
    this.props.onContextMenu(event)
  }

  render() {
    const { onContextMenu, onDrop } = this.props

    return (
      <div id="project" onContextMenu={this.handleContextMenu}>
        <ProjectDropZone onDrop={onDrop}>
          <div id="project-view">
            <Resizable edge="right" value={250}>
              <ProjectSidebar
                hasToolbar={ARGS.frameless}
                onContextMenu={onContextMenu}/>
            </Resizable>
            <main>
              <Items onContextMenu={onContextMenu}/>
            </main>
          </div>
          <Item/>
        </ProjectDropZone>
      </div>
    )
  }

  static propTypes = {
    onContextMenu: PropTypes.func,
    onDrop: PropTypes.func
  }
}


module.exports = {
  Project: connect(
    null,
    dispatch => ({
      onContextMenu(event, ...args) {
        event.stopPropagation()
        dispatch(actions.ui.context.show(event, ...args))
      },

      onDrop({ project, images }) {
        if (project) {
          return dispatch(actions.project.open(project))
        }

        if (images && images.length) {
          return dispatch(actions.item.import(images))
        }
      }
    })
  )(Project)
}
