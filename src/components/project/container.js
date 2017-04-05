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
const { win } = require('../../window')
const cx = require('classnames')
const { values } = Object
const actions = require('../../actions')

const {
  getActivities,
  getAllTags,
  getCachePrefix,
  getColumns,
  getSelectedItems,
  getSelectedPhoto,
  getSelectedNote,
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
      mode: props.nav.mode,
      offset: props.ui.panel.width,
      willModeChange: false,
      isModeChanging: false
    }
  }

  componentWillUnmount() {
    this.clearTimeouts()
  }

  componentWillReceiveProps({ nav, ui }) {
    if (nav.mode !== this.props.nav.mode) {
      this.modeWillChange()
    }

    if (this.props.ui.panel !== ui.panel) {
      this.setState({ offset: ui.panel.width })
    }
  }


  get classes() {
    const { isOver, canDrop } = this.props
    const { willModeChange, isModeChanging } = this.state

    return {
      project: true,
      over: isOver && canDrop,
      [`${this.state.mode}-mode`]: true,
      [`${this.state.mode}-mode-leave`]: willModeChange,
      [`${this.state.mode}-mode-leave-active`]: isModeChanging,
      [`${this.props.nav.mode}-mode-enter`]: willModeChange,
      [`${this.props.nav.mode}-mode-enter-active`]: isModeChanging
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
        mode: this.props.nav.mode,
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

  handlePanelResize = (offset) => {
    this.setState({ offset })
  }

  handlePanelDragStop = () => {
    this.props.onUiUpdate({
      panel: { width: Math.round(this.state.offset) }
    })
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
      note,
      notes,
      photo,
      photos,
      visiblePhotos,
      selection,
      ui,
      ...props
    } = this.props

    return dt(
      <div
        className={cx(this.classes)}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}>

        <ProjectView {...props}
          activities={activities}
          nav={nav}
          items={items}
          data={data}
          isActive={this.state.mode === MODE.PROJECT}
          columns={columns}
          sidebar={ui.sidebar}
          offset={this.state.offset}
          photos={photos}
          zoom={ui.zoom}
          onMetadataSave={this.handleMetadataSave}/>

        <ItemView {...props}
          items={selection}
          data={data}
          note={note}
          notes={notes}
          photo={photo}
          photos={visiblePhotos}
          panel={ui.panel}
          esper={ui.esper}
          offset={this.state.offset}
          mode={this.state.mode}
          isModeChanging={this.state.isModeChanging}
          isTrashSelected={!!nav.trash}
          onPanelResize={this.handlePanelResize}
          onPanelDragStop={this.handlePanelDragStop}
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

    photo: object,
    photos: object.isRequired,
    visiblePhotos: arrayOf(
      shape({ id: number.isRequired })
    ),

    note: shape({ id: number.isRequired }),
    notes: arrayOf(
      shape({ id: number.isRequired })
    ),

    activities: arrayOf(
      shape({ id: number.isRequired })
    ),

    nav: shape({
      mode: oneOf(values(MODE)).isRequired
    }).isRequired,

    ui: object.isRequired,
    data: object.isRequired,
    columns: arrayOf(object),
    cache: string.isRequired,
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
    onSort: func.isRequired,
    onUiUpdate: func.isRequired
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
      activities: getActivities(state),
      cache: getCachePrefix(state),
      columns: getColumns(state),
      data: state.metadata,
      edit: state.edit,
      items: getVisibleItems(state),
      keymap: state.keymap,
      lists: state.lists,
      nav: state.nav,
      note: getSelectedNote(state),
      notes: getVisibleNotes(state),
      photo: getSelectedPhoto(state),
      photos: state.photos,
      visiblePhotos: getVisiblePhotos(state),
      project: state.project,
      properties: state.properties,
      selection: getSelectedItems(state),
      sort: state.nav.sort,
      tags: getAllTags(state),
      ui: state.ui
    }),

    dispatch => ({
      onMaximize() {
        win.maximize()
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

      onItemImport(...args) {
        dispatch(actions.item.import(...args))
      },

      onItemDelete(items) {
        dispatch(actions.item.delete(items.map(item => item.id)))
      },

      onItemMerge(...args) {
        dispatch(actions.item.merge(...args))
      },

      onItemPreview(...args) {
        dispatch(actions.item.preview(...args))
      },

      onItemTagAdd(...args) {
        dispatch(actions.item.tags.add(...args))
      },

      onItemTagRemove(...args) {
        dispatch(actions.item.tags.remove(...args))
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

      onTagDelete(...args) {
        dispatch(actions.tag.delete(...args))
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
      },

      onUiUpdate(...args) {
        dispatch(actions.ui.update(...args))
      }
    })

  )(DropTarget(NativeTypes.FILE, DropTargetSpec, (c, m) => ({
    dt: c.dropTarget(), isOver: m.isOver(), canDrop: m.canDrop()
  }))(ProjectContainer))
}
