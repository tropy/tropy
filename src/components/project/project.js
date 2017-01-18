'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')

const { Resizable } = require('../resizable')
const { Item, Items } = require('../item')
const { ProjectSidebar } = require('./sidebar')
const { ProjectDropZone } = require('./drop-zone')
const { ProjectDragLayer } = require('./drag-layer')

const { getCachePrefix } = require('../../selectors/project')
const { MODE } = require('../../constants/project')
const { once } = require('../../dom')

const cn = require('classnames')
const values = require('object.values')
const actions = require('../../actions')



class Project extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mode: props.mode,
      willModeChange: false,
      isModeChanging: false
    }
  }

  componentWillUnmount() {
    this.clearTimeouts()
  }

  componentWillReceiveProps({ mode }) {
    if (mode !== this.props.mode) {
      this.modeWillChange()
    }
  }

  modeWillChange() {
    if (this.state.willModeChange) return

    once(this.container, 'transitionend', this.modeDidChange)
    this.modeDidChange.timeout = setTimeout(this.modeDidChange, 5000)

    this.setState({ willModeChange: true, isModeChanging: false })

    setTimeout(() => {
      this.setState({ isModeChanging: true })
    }, 0)
  }

  modeDidChange = () => {
    try {
      this.setState({
        mode: this.props.mode,
        willModeChange: false,
        isModeChanging: false
      })
    } finally {
      this.clearTimeouts()
    }
  }

  clearTimeouts() {
    if (this.modeDidChange.timeout) {
      clearTimeout(this.modeDidChange.timeout)
      this.modeDidChange.timeout = undefined
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  get classes() {
    const { willModeChange, isModeChanging } = this.state

    return {
      [`${this.state.mode}-mode`]: true,
      [`${this.state.mode}-mode-leave`]: willModeChange,
      [`${this.state.mode}-mode-leave-active`]: isModeChanging,
      [`${this.props.mode}-mode-enter`]: willModeChange,
      [`${this.props.mode}-mode-enter-active`]: isModeChanging
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event)
  }

  handleModeChange = (mode) => {
    this.props.onModeChange(mode)
  }

  render() {
    const { onDrop, onItemOpen, ...props } = this.props

    return (
      <div
        id="project"
        className={cn(this.classes)}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}>
        <ProjectDropZone onDrop={onDrop}>
          <div id="project-view">
            <Resizable edge="right" value={250}>
              <ProjectSidebar {...props} hasToolbar={ARGS.frameless}/>
            </Resizable>
            <main>
              <Items {...props} onOpen={onItemOpen}/>
            </main>
          </div>
          <Item {...props} onOpen={onItemOpen}/>
        </ProjectDropZone>
        <ProjectDragLayer {...props}/>
      </div>
    )
  }

  static propTypes = {
    cache: PropTypes.string.isRequired,
    mode: PropTypes.oneOf(values(MODE)).isRequired,
    zoom: PropTypes.number,
    onContextMenu: PropTypes.func,
    onEditCancel: PropTypes.func,
    onDrop: PropTypes.func,
    onItemOpen: PropTypes.func,
    onItemsDelete: PropTypes.func,
    onModeChange: PropTypes.func
  }

  static defaultProps = {
    mode: MODE.PROJECT
  }
}


module.exports = {
  Project: connect(
    state => ({
      cache: getCachePrefix(state),
      mode: state.nav.mode,
      zoom: state.nav.itemsZoom
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
      },

      onItemOpen(item) {
        dispatch(actions.item.open(item))
      },

      onItemsDelete(items) {
        dispatch(actions.item.delete(items.map(item => item.id)))
      },

      onEditCancel() {
        dispatch(actions.ui.edit.cancel())
      }
    })
  )(Project)
}
