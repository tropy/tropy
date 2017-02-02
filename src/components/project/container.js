'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')

const Window = require('../../window')

const { ProjectView } = require('./view')
const { ItemView } = require('../item')
const { DragLayer } = require('../drag-layer')
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { extname } = require('path')

const { getCachePrefix } = require('../../selectors/project')
const { getTemplates } = require('../../selectors/templates')
const { MODE } = require('../../constants/project')
const { once } = require('../../dom')
const { values } = Object

const cn = require('classnames')
const actions = require('../../actions')


class ProjectContainer extends Component {
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


  get classes() {
    const { isOver, canDrop } = this.props
    const { willModeChange, isModeChanging } = this.state

    return {
      'project-container': true,
      'over': isOver && canDrop,
      [`${this.state.mode}-mode`]: true,
      [`${this.state.mode}-mode-leave`]: willModeChange,
      [`${this.state.mode}-mode-leave-active`]: isModeChanging,
      [`${this.props.mode}-mode-enter`]: willModeChange,
      [`${this.props.mode}-mode-enter-active`]: isModeChanging
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

  handleContextMenu = (event) => {
    this.props.onContextMenu(event)
  }

  handleModeChange = (mode) => {
    this.props.onModeChange(mode)
  }

  setContainer = (container) => {
    this.container = container
  }


  render() {
    const { dt, ...props } = this.props

    return dt(
      <div
        id="project"
        className={cn(this.classes)}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}>

        <ProjectView {...props}/>
        <ItemView {...props}/>
        <DragLayer cache={props.cache}/>
      </div>
    )
  }

  static propTypes = {
    cache: PropTypes.string.isRequired,
    mode: PropTypes.oneOf(values(MODE)).isRequired,

    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,
    dt: PropTypes.func.isRequired,

    onContextMenu: PropTypes.func,
    onDropProject: PropTypes.func,
    onDropImages: PropTypes.func,
    onModeChange: PropTypes.func
  }

  static defaultProps = {
    mode: MODE.PROJECT
  }
}


// Project Drop Target Spec
// ------------------------

const spec = {
  drop({ onDropProject, onDropImages }, monitor) {
    const { files } = monitor.getItem()
    const images = []

    for (let file of files) {
      if (extname(file.path) === '.tpy') {
        return onDropProject(file.path), { project: file.path }
      }

      if (file.type === 'image/jpeg') {
        images.push(file.path)
      }
    }

    if (images.length) {
      return onDropImages(images), { images }
    }
  }
}


module.exports = {
  ProjectContainer: connect(
    state => ({
      cache: getCachePrefix(state),
      mode: state.nav.mode,
      zoom: state.nav.itemsZoom,
      nav: state.nav,
      ui: state.ui,
      properties: state.properties,
      templates: getTemplates(state)
    }),

    dispatch => ({
      onMaximize() {
        Window.maximize()
      },

      onContextMenu(event, ...args) {
        event.stopPropagation()
        dispatch(actions.ui.context.show(event, ...args))
      },

      onDropProject(path) {
        dispatch(actions.project.open(path))
      },

      onDropImages(paths) {
        dispatch(actions.item.import(paths))
      },

      onModeChange(mode) {
        dispatch(actions.nav.update({ mode }))
      },

      onProjectSave(...args) {
        dispatch(actions.project.save(...args))
        dispatch(actions.ui.edit.cancel())
      },

      onItemOpen(item) {
        dispatch(actions.item.open(item))
      },

      onItemSave(...args) {
        dispatch(actions.item.save(...args))
      },

      onItemsDelete(items) {
        dispatch(actions.item.delete(items.map(item => item.id)))
      },

      onMetadataSave(...args) {
        dispatch(actions.metadata.save(...args))
        dispatch(actions.ui.edit.cancel())
      },

      onPhotoMove(...args) {
        dispatch(actions.photo.move(...args))
      },

      onPhotoSort(...args) {
        dispatch(actions.photo.order(...args))
      },

      onListSave(...args) {
        dispatch(actions.list.save(...args))
        dispatch(actions.ui.edit.cancel())
      },

      onListSort(...args) {
        dispatch(actions.list.order(...args))
      },

      onListItemsAdd({ list, items }) {
        dispatch(actions.list.items.add({
          id: list, items: items.map(item => item.id)
        }))
      },

      onEdit(...args) {
        dispatch(actions.ui.edit.start(...args))
      },

      onEditCancel() {
        dispatch(actions.ui.edit.cancel())
      }
    })

  )(DropTarget(NativeTypes.FILE, spec, (c, m) => ({
    dt: c.dropTarget(), isOver: m.isOver(), canDrop: m.canDrop()
  }))(ProjectContainer))
}
