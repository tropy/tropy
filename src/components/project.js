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

  handleModeChange = () => {
    const { mode, onModeChange } = this.props
    onModeChange(mode === 'project' ? 'item' : 'project')
  }

  render() {
    const { mode, onContextMenu, onDrop } = this.props

    return (
      <div
        id="project"
        className={`${mode}-mode`}
        onContextMenu={this.handleContextMenu}>
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
          <Item onModeChange={this.handleModeChange}/>
        </ProjectDropZone>
      </div>
    )
  }

  static propTypes = {
    mode: PropTypes.oneOf(['project', 'item']).isRequired,
    onContextMenu: PropTypes.func,
    onDrop: PropTypes.func,
    onModeChange: PropTypes.func
  }

  static defaultProps = {
    mode: 'project'
  }
}


module.exports = {
  Project: connect(
    state => ({
      mode: state.nav.mode
    }),

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
      },

      onModeChange(mode) {
        dispatch(actions.nav.update({ mode }))
      }
    })
  )(Project)
}
