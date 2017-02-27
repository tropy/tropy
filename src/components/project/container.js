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
const { MODE } = require('../../constants/project')
const { once } = require('../../dom')
const { values } = Object
const Window = require('../../window')
const cx = require('classnames')
const actions = require('../../actions')

const { getCachePrefix } = require('../../selectors/project')
const { getAllVisibleTags } = require('../../selectors/tag')
const { getTemplates } = require('../../selectors/templates')
const { getColumns } = require('../../selectors/ui')

const {
  getBusyActivities,
  getSelectedItems,
  getVisibleItems,
  getVisibleNotes,
  getVisiblePhotos
} = require('../../selectors')

const {
  arrayOf, oneOf, shape, bool, object, func, string, number
} = PropTypes


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

  handleMetadataSave = (payload, meta = {}) => {
    const { sort, onMetadataSave } = this.props

    if (sort.column in payload.data) {
      meta.search = true
    }

    onMetadataSave(payload, meta)
  }

  setContainer = (container) => {
    this.container = container
  }


  render() {
    const {
      activities,
      columns,
      data,
      dt,
      items,
      nav,
      notes,
      photos,
      selection,
      ...props
    } = this.props

    return dt(
      <div
        id="project"
        className={cx(this.classes)}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}>

        <ProjectView {...props}
          activities={activities}
          nav={nav}
          items={items}
          data={data}
          columns={columns}
          onMetadataSave={this.handleMetadataSave}/>

        <ItemView {...props}
          items={selection}
          data={data}
          note={nav.note}
          notes={notes}
          photo={nav.photo}
          photos={photos}
          panel={nav.panel}
          onMetadataSave={this.handleMetadataSave}/>

        <DragLayer cache={props.cache}/>
      </div>
    )
  }


  static propTypes = {
    project: shape({
      file: string
    }).isRequired,

    items: arrayOf(
      shape({ id: number.isRequired })
    ),

    selection: arrayOf(
      shape({ id: number.isRequired })
    ),

    photos: arrayOf(
      shape({ id: number.isRequired })
    ),

    notes: arrayOf(
      shape({ id: number.isRequired })
    ),

    activities: arrayOf(
      shape({ id: number.isRequired })
    ),

    nav: object.isRequired,
    data: object.isRequired,
    columns: arrayOf(object),
    cache: string.isRequired,
    mode: oneOf(values(MODE)).isRequired,
    sort: shape({
      asc: bool,
      column: string.isRequired,
      type: oneOf(['property']).isRequired
    }).isRequired,

    isOver: bool,
    canDrop: bool,
    dt: func.isRequired,

    onContextMenu: func.isRequired,
    onProjectOpen: func.isRequired,
    onModeChange: func.isRequired,
    onMetadataSave: func.isRequired,
    onSort: func.isRequired
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
      activities: getBusyActivities(state),
      project: state.project,
      mode: state.nav.mode,
      lists: state.lists,
      tags: getAllVisibleTags(state),
      columns: getColumns(state),
      items: getVisibleItems(state),
      selection: getSelectedItems(state),
      notes: getVisibleNotes(state),
      photos: getVisiblePhotos(state),
      sort: state.nav.sort,
      data: state.metadata,
      cache: getCachePrefix(state),
      nav: state.nav,
      ui: state.ui,
      context: state.context,
      edit: state.edit,
      properties: state.properties,
      templates: getTemplates(state)
    }),

    dispatch => ({
      onMaximize() {
        Window.maximize()
      },

      onContextMenu(event, ...args) {
        event.stopPropagation()
        dispatch(actions.context.show(event, ...args))
      },

      onModeChange(mode) {
        dispatch(actions.nav.update({ mode }))
      },

      onProjectOpen(path) {
        dispatch(actions.project.open(path))
      },

      onProjectSave(...args) {
        dispatch(actions.project.save(...args))
        dispatch(actions.edit.cancel())
      },

      onSelect(...args) {
        dispatch(actions.nav.select(...args))
      },

      onSort(...args) {
        dispatch(actions.nav.sort(...args))
      },

      onItemSelect(id, mod, meta) {
        dispatch(actions.item.select(id, { mod, ...meta }))
      },

      onItemOpen(item) {
        dispatch(actions.item.open(item))
      },

      onItemCreate() {
        dispatch(actions.item.create())
      },

      onItemSave(...args) {
        dispatch(actions.item.save(...args))
      },

      onItemZoomChange(itemsZoom) {
        dispatch(actions.nav.update({ itemsZoom }, { throttle: true }))
      },

      onItemImport(...args) {
        dispatch(actions.item.import(...args))
      },

      onItemDelete(items) {
        dispatch(actions.item.delete(items.map(item => item.id)))
      },

      onItemPreview(...args) {
        dispatch(actions.item.preview(...args))
      },

      onPanelTabSelect(tab) {
        dispatch(actions.nav.panel.update({ tab }))
      },

      onMetadataSave(...args) {
        dispatch(actions.metadata.save(...args))
        dispatch(actions.edit.cancel())
      },

      onPhotoCreate(...args) {
        dispatch(actions.photo.create(...args))
      },

      onPhotoMove(...args) {
        dispatch(actions.photo.move(...args))
      },

      onPhotoSort(...args) {
        dispatch(actions.photo.order(...args))
      },

      onPhotoSelect(...args) {
        dispatch(actions.photo.select(...args))
      },

      onPhotoZoomChange(photoZoom) {
        dispatch(actions.nav.panel.update({ photoZoom }, { throttle: true }))
      },

      onListSave(...args) {
        dispatch(actions.list.save(...args))
        dispatch(actions.edit.cancel())
      },

      onListSort(...args) {
        dispatch(actions.list.order(...args))
      },

      onListItemsAdd({ list, items }) {
        dispatch(actions.list.items.add({
          id: list, items: items.map(item => item.id)
        }))
      },

      onTagCreate(data) {
        dispatch(actions.tag.create(data))
        dispatch(actions.edit.cancel())
      },

      onTagSave(data, id) {
        dispatch(actions.tag.save({ ...data, id }))
        dispatch(actions.edit.cancel())
      },

      onTagSelect(...args) {
        dispatch(actions.tag.select(...args))
      },

      onNoteCreate(...args) {
        dispatch(actions.note.create(...args))
      },

      onNoteSave(...args) {
        dispatch(actions.note.save(...args))
      },

      onNoteDelete(...args) {
        dispatch(actions.note.delete(...args))
      },

      onNoteRestore(...args) {
        dispatch(actions.note.delete(...args))
      },

      onNoteSelect(...args) {
        dispatch(actions.note.select(...args))
      },

      onEdit(...args) {
        dispatch(actions.edit.start(...args))
      },

      onEditCancel() {
        dispatch(actions.edit.cancel())
      }
    })

  )(DropTarget(NativeTypes.FILE, DropTargetSpec, (c, m) => ({
    dt: c.dropTarget(), isOver: m.isOver(), canDrop: m.canDrop()
  }))(ProjectContainer))
}
