'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { ProjectView } = require('./view')
const { ItemView } = require('../item')
const { DragLayer } = require('../drag-layer')
const { DropTarget, NativeTypes } = require('../dnd')
const { NoProject } = require('./none')
const { extname } = require('path')
const { MODE } = require('../../constants/project')
const { emit, on, off, ensure, reflow } = require('../../dom')
const cx = require('classnames')
const { values } = Object
const actions = require('../../actions')
const debounce = require('lodash.debounce')
const { match } = require('../../keymap')

const {
  getCachePrefix,
  getAllColumns,
  getSelectedItems,
  getSelectedPhoto,
  getSelectedNote,
  getSortColumn,
  getVisibleItems,
  getVisibleNotes,
  getVisiblePhotos
} = require('../../selectors')

const {
  arrayOf, oneOf, shape, bool, object, func, string, number
} = require('prop-types')


class ProjectContainer extends React.Component {
  container = React.createRef()

  constructor(props) {
    super(props)

    this.state = {
      isProjectClosed: false,
      willProjectClose: false,
      mode: props.nav.mode,
      offset: props.ui.panel.width,
      willModeChange: false,
      isModeChanging: false
    }
  }

  componentDidMount() {
    on(document, 'keydown', this.handleKeyDown)
    on(document, 'global:back', this.handleBackButton)
  }

  componentDidUpdate({ project, nav, ui }) {
    if (nav.mode !== this.props.nav.mode) {
      this.modeWillChange()
    }

    if (ui.panel !== this.props.ui.panel) {
      this.setState({
        offset: this.props.ui.panel.width
      })
    }

    if (project !== this.props.project) {
      this.projectWillChange(this.props.project)
      if (this.state.isProjectClosed) {
        this.projectWillChange.flush()
      }
    }
  }

  componentWillUnmount() {
    this.projectWillChange.cancel()
    off(document, 'keydown', this.handleKeyDown)
    off(document, 'global:back', this.handleBackButton)
  }

  get classes() {
    const { isOver, canDrop, nav } = this.props
    const { mode, willModeChange, isModeChanging } = this.state

    return ['project', {
      closing: this.state.willProjectClose,
      empty: this.isEmpty,
      over: isOver && canDrop,
      [`${mode}-mode`]: true,
      [`${mode}-mode-leave`]: willModeChange,
      [`${mode}-mode-leave-active`]: isModeChanging,
      [`${nav.mode}-mode-enter`]: willModeChange,
      [`${nav.mode}-mode-enter-active`]: isModeChanging
    }]
  }

  get isEmpty() {
    return this.props.project.id != null &&
      this.props.project.items === 0
  }

  modeWillChange() {
    if (this.state.willModeChange) return

    this.setState({ willModeChange: true, isModeChanging: false }, () => {
      if (this.container.current) {
        let node = this.container.current
        reflow(node)

        requestAnimationFrame(() => {
          this.setState({ isModeChanging: true })
          ensure(
            node,
            'transitionend',
            this.modeDidChange,
            3000,
            event => event.target.parentNode === node)
        })
      } else {
        this.modeDidChange()
      }
    })
  }

  modeDidChange = () => {
    this.setState({
      mode: this.props.nav.mode,
      willModeChange: false,
      isModeChanging: false
    })
  }

  projectWillChange = debounce(project => {
    this.setState({
      isProjectClosed: !!project.closed,
      willProjectClose: project.closing,
    })
  }, 750, { leading: false })


  handleBackButton = () => {
    if (this.state.mode !== MODE.PROJECT) {
      this.handleModeChange(MODE.PROJECT)
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

  handleKeyDown = (event) => {
    switch (match(this.props.keymap.global, event)) {
      case 'back':
        emit(document, 'global:back')
        break
      case 'nextItem':
        emit(document, 'global:next-item')
        break
      case 'prevItem':
        emit(document, 'global:prev-item')
        break
      case 'nextPhoto':
        emit(document, 'global:next-photo')
        break
      case 'prevPhoto':
        emit(document, 'global:prev-photo')
        break
      case 'nextTab':
        emit(document, 'global:next-tab')
        break
      case 'prevTab':
        emit(document, 'global:prev-tab')
        break
      default:
        return
    }

    event.stopPropagation()
    event.preventDefault()
  }

  renderNoProject() {
    return (
      <NoProject
        connect={this.props.dt}
        canDrop={this.props.canDrop}
        isOver={this.props.isOver}
        onProjectCreate={this.props.onProjectCreate}
        onProjectOpen={this.props.onProjectOpen}
        recent={ARGS.recent}/>
    )
  }
  render() {
    if (!this.props.project.file || this.state.isProjectClosed) {
      return this.renderNoProject()
    }

    const {
      columns,
      data,
      dt,
      items,
      nav,
      note,
      notes,
      photo,
      photos,
      project,
      visiblePhotos,
      selection,
      templates,
      ui,
      ...props
    } = this.props

    return dt(
      <div
        className={cx(this.classes)}
        ref={this.container}
        onContextMenu={this.handleContextMenu}>

        <ProjectView {...props}
          nav={nav}
          items={items}
          data={data}
          isActive={this.state.mode === MODE.PROJECT && !project.closing}
          isEmpty={this.isEmpty}
          columns={columns}
          offset={this.state.offset}
          photos={photos}
          templates={templates}
          zoom={ui.zoom}
          onMetadataSave={this.handleMetadataSave}/>

        <ItemView {...props}
          items={selection}
          data={data}
          activeSelection={nav.selection}
          note={note}
          notes={notes}
          photo={photo}
          photos={visiblePhotos}
          panel={ui.panel}
          offset={this.state.offset}
          mode={this.state.mode}
          isModeChanging={this.state.isModeChanging}
          isTrashSelected={!!nav.trash}
          isProjectClosing={project.closing}
          onPanelResize={this.handlePanelResize}
          onPanelDragStop={this.handlePanelDragStop}
          onMetadataSave={this.handleMetadataSave}/>

        <DragLayer
          cache={props.cache}
          photos={photos}
          tags={props.tags}
          onPhotoError={props.onPhotoError}/>
        <div className="cover" />
      </div>
    )
  }


  static propTypes = {
    project: shape({
      file: string
    }).isRequired,

    keymap: object.isRequired,
    items: arrayOf(
      shape({ id: number.isRequired })
    ).isRequired,

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

    nav: shape({
      mode: oneOf(values(MODE)).isRequired
    }).isRequired,

    ui: object.isRequired,
    data: object.isRequired,
    columns: object.isRequired,
    cache: string.isRequired,
    sort: object.isRequired,
    tags: object.isRequired,
    templates: object.isRequired,

    isOver: bool,
    canDrop: bool,
    dt: func.isRequired,

    onContextMenu: func.isRequired,
    onPhotoError: func.isRequired,
    onProjectCreate: func.isRequired,
    onProjectOpen: func.isRequired,
    onModeChange: func.isRequired,
    onMetadataSave: func.isRequired,
    onSort: func.isRequired,
    onTemplateImport: func.isRequired,
    onUiUpdate: func.isRequired
  }
}


const DropTargetSpec = {
  drop({ onProjectOpen, onTemplateImport, project }, monitor) {
    let files = monitor.getItem().files.map(f => f.path)

    switch (extname(files[0])) {
      case '.tpy':
        files = files.slice(0, 1)
        if (files[0] !== project.file) {
          onProjectOpen(files[0])
        }
        break
      case '.ttp':
        files = files.filter(f => f.endsWith('.ttp'))
        onTemplateImport(files)
        break
      default:
        files = []
    }

    return { files }
  },

  canDrop({ project }, monitor) {
    const { types } = monitor.getItem()

    if (types.length < 1) return false

    switch (types[0]) {
      case 'application-vnd.tropy.tpy':
        return project.closed //|| files[0].path !== project.file
      case 'application-vnd.tropy.ttp':
        return true
      default:
        return false
    }
  }
}


module.exports = {
  ProjectContainer: connect(
    state => ({
      cache: getCachePrefix(state),
      columns: getAllColumns(state),
      data: state.metadata,
      edit: state.edit,
      index: state.qr.index,
      items: getVisibleItems(state),
      keymap: state.keymap,
      nav: state.nav,
      note: getSelectedNote(state),
      notes: getVisibleNotes(state),
      photo: getSelectedPhoto(state),
      photos: state.photos,
      visiblePhotos: getVisiblePhotos(state),
      project: state.project,
      selection: getSelectedItems(state),
      sort: getSortColumn(state),
      templates: state.ontology.template,
      tags: state.tags,
      ui: state.ui
    }),

    dispatch => ({
      onContextMenu(event, ...args) {
        event.stopPropagation()
        dispatch(actions.context.show(event, ...args))
      },

      onModeChange(mode) {
        dispatch(actions.nav.update({ mode }))
      },

      onOpenInFolder(...args) {
        dispatch(actions.shell.openInFolder(args))
      },

      onProjectCreate() {
        dispatch(actions.project.create())
      },

      onProjectOpen(path) {
        dispatch(actions.project.open(path))
      },

      onColumnInsert(...args) {
        dispatch(actions.nav.column.insert(...args))
      },

      onColumnRemove(...args) {
        dispatch(actions.nav.column.remove(...args))
      },

      onColumnOrder(...args) {
        dispatch(actions.nav.column.order(...args))
      },

      onColumnResize(...args) {
        dispatch(actions.nav.column.resize(...args))
      },

      onSelect(...args) {
        dispatch(actions.nav.select(...args))
      },

      onSearch(query) {
        dispatch(actions.nav.search({ query }))
      },

      onSort(...args) {
        dispatch(actions.nav.sort(...args))
      },

      onItemSelect(payload, mod, meta) {
        dispatch(actions.item.select(payload, { mod, ...meta }))
      },

      onItemOpen(item) {
        dispatch(actions.item.open(item))
      },

      onItemCreate() {
        dispatch(actions.item.create())
      },

      onItemImport(...args) {
        dispatch(actions.item.import(...args))
      },

      onItemExport(items, meta) {
        dispatch(actions.item.export(items, meta))
      },

      onItemDelete(items) {
        dispatch(actions.item.delete(items))
      },

      onItemMerge(...args) {
        dispatch(actions.item.merge(...args))
      },

      onItemPreview(...args) {
        dispatch(actions.item.preview(...args))
      },

      onItemTagAdd(...args) {
        dispatch(actions.item.tags.create(...args))
      },

      onItemTagRemove(...args) {
        dispatch(actions.item.tags.delete(...args))
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

      onPhotoError(...args) {
        dispatch(actions.photo.error(...args))
      },

      onPhotoRotate(...args) {
        dispatch(actions.photo.rotate(...args))
      },

      onPhotoSelect(...args) {
        dispatch(actions.photo.select(...args))
      },

      onTagCreate(data) {
        dispatch(actions.tag.create(data))
        dispatch(actions.edit.cancel())
      },

      onTagSave(data, id) {
        dispatch(actions.tag.save({ ...data, id }))
        dispatch(actions.edit.cancel())
      },

      onTemplateImport(files) {
        dispatch(actions.ontology.template.import({ files }))
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
