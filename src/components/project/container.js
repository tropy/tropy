'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { ProjectView } = require('./view')
const { ItemView } = require('../item')
const { DragLayer } = require('../drag-layer')
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { extname } = require('path')
const { getCachePrefix } = require('../../selectors/project')
const { getAllVisibleTags } = require('../../selectors/tag')
const { getTemplates } = require('../../selectors/templates')
const { MODE } = require('../../constants/project')
const { once } = require('../../dom')
const { values } = Object
const Window = require('../../window')
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
    project: PropTypes.shape({
      file: PropTypes.string
    }).isRequired,

    cache: PropTypes.string.isRequired,
    mode: PropTypes.oneOf(values(MODE)).isRequired,

    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,
    dt: PropTypes.func.isRequired,

    onContextMenu: PropTypes.func.isRequired,
    onProjectOpen: PropTypes.func.isRequired,
    onModeChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    mode: MODE.PROJECT
  }
}


const DropTargetSpec = {
  drop({ onProjectOpen }, monitor) {
    const { files } = monitor.getItem()
    const project = files[0].path

    return onProjectOpen(project), { project }
  },

  canDrop({ project }, monitor) {
    const { files } = monitor.getItem()

    if (files.length !== 1) return false
    if (extname(files[0].path) !== '.tpy') return false
    if (files[0].path === project.file) return false

    return true
  }
}


module.exports = {
  ProjectContainer: connect(
    state => ({
      project: state.project,
      mode: state.nav.mode,
      lists: state.lists,
      tags: getAllVisibleTags(state),
      cache: getCachePrefix(state),
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

      onModeChange(mode) {
        dispatch(actions.nav.update({ mode }))
      },

      onProjectOpen(path) {
        dispatch(actions.project.open(path))
      },

      onProjectSave(...args) {
        dispatch(actions.project.save(...args))
        dispatch(actions.ui.edit.cancel())
      },

      onSelect(...args) {
        dispatch(actions.nav.select(...args))
      },

      onItemOpen(item) {
        dispatch(actions.item.open(item))
      },

      onItemSave(...args) {
        dispatch(actions.item.save(...args))
      },

      onItemImport(...args) {
        dispatch(actions.item.import(...args))
      },

      onItemDelete(items) {
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

  )(DropTarget(NativeTypes.FILE, DropTargetSpec, (c, m) => ({
    dt: c.dropTarget(), isOver: m.isOver(), canDrop: m.canDrop()
  }))(ProjectContainer))
}
