import { extname } from 'path'
import debounce from 'lodash.debounce'
import React from 'react'
import { connect } from 'react-redux'
import ARGS from '../../args'
import { ProjectView } from './view'
import { ItemView } from '../item'
import { DragLayer } from '../drag-layer'
import { DND, DropTarget, hasProjectFiles } from '../dnd'
import { NoProject } from './none'
import { PROJECT } from '../../constants'
import { emit, on, off, ensure, isInput, reflow } from '../../dom'
import cx from 'classnames'
import * as act from '../../actions'
import { match } from '../../keymap'
import { warn } from '../../common/log'

import {
  getCachePrefix,
  getAllColumns,
  getSelectedItems,
  getSelectedPhoto,
  getSelectedNote,
  getSortColumn,
  getVisibleItems,
  getVisibleNotes,
  getVisiblePhotos
} from '../../selectors'

import {
  arrayOf, oneOf, shape, bool, object, func, string, number
} from 'prop-types'

const { MODE } = PROJECT


class Project extends React.Component {
  container = React.createRef()

  state = {
    isProjectClosed: false,
    willProjectClose: false,
    mode: this.props.nav.mode,
    offset: this.props.ui.panel.width,
    willModeChange: false,
    isModeChanging: false
  }

  componentDidMount() {
    on(document, 'keydown', this.handleKeyDown)
    on(document, 'global:back', this.handleBackButton)
    on(window, 'paste', this.handlePaste)
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
    off(window, 'paste', this.handlePaste)
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

  get isProjectDisabled() {
    return this.state.mode !== MODE.PROJECT ||
      this.state.isProjectClosed ||
      this.state.willProjectClose
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
      willProjectClose: project.closing
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

  handlePaste = (event) => {
    try {
      if (isInput(event.target)) return

      var text = event.clipboardData.getData('text/plain')

      if (text) {
        let data = JSON.parse(text)
        if (data) {
          this.props.onItemImport({
            data: JSON.parse(text),
            list: this.props.nav.list
          })
        }
      }
    } catch (e) {
      warn({ stack: e.stack, text }, 'pasted unsupported text')
    }
  }

  handleMetadataSave = (payload, meta = {}) => {
    const { sort, onMetadataSave } = this.props

    if (sort.column in payload.data) {
      meta.search = true
    }

    onMetadataSave(payload, meta)
  }

  handleKeyDown = (event) => {
    if (isInput(event.target))
      return

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
      case 'find':
        emit(document, 'global:find')
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
        connect={this.props.connectDropTarget}
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
      connectDropTarget,
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

    return connectDropTarget(
      <div
        className={cx(this.classes)}
        ref={this.container}
        onContextMenu={this.handleContextMenu}>

        <ProjectView {...props}
          nav={nav}
          items={items}
          data={data}
          isDisabled={this.isProjectDisabled}
          isEmpty={this.isEmpty}
          columns={columns}
          offset={this.state.offset}
          photos={photos}
          project={project}
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
          isProjectClosing={project.closing}
          isReadOnly={project.isReadOnly || nav.trash}
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
      mode: oneOf(Object.values(MODE)).isRequired
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
    connectDropTarget: func.isRequired,

    onContextMenu: func.isRequired,
    onItemImport: func.isRequired,
    onPhotoConsolidate: func.isRequired,
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
    let tpy = []
    let ttp = []

    for (let file of monitor.getItem().files) {
      switch (extname(file.path)) {
        case '.tpy':
          tpy.push(file.path)
          break
        case '.ttp':
          ttp.push(file.path)
          break
      }
    }

    // Subtle: currently handling only the first project file!
    if (tpy.length > 0 && tpy[0] !== project.file) {
      onProjectOpen(tpy[0])
      return { files: tpy }
    }

    if (ttp.length > 0) {
      onTemplateImport(ttp)
      return { files: ttp }
    }
  },

  canDrop(_, monitor) {
    return hasProjectFiles(monitor)
  }
}


export const ProjectContainer = connect(
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
      dispatch(act.context.show(event, ...args))
    },

    onModeChange(mode) {
      dispatch(act.nav.update({ mode }))
    },

    onOpenInFolder(...args) {
      dispatch(act.shell.open(...args))
    },

    onProjectCreate() {
      dispatch(act.project.create())
    },

    onProjectOpen(path) {
      dispatch(act.project.open(path))
    },

    onColumnInsert(...args) {
      dispatch(act.nav.column.insert(...args))
    },

    onColumnRemove(...args) {
      dispatch(act.nav.column.remove(...args))
    },

    onColumnOrder(...args) {
      dispatch(act.nav.column.order(...args))
    },

    onColumnResize(...args) {
      dispatch(act.nav.column.resize(...args))
    },

    onSelect(...args) {
      dispatch(act.nav.select(...args))
    },

    onSearch(query) {
      dispatch(act.nav.search({ query }))
    },

    onSort(...args) {
      dispatch(act.nav.sort(...args))
    },

    onItemSelect(...args) {
      dispatch(act.item.select(...args))
    },

    onItemOpen(item) {
      dispatch(act.item.open(item))
    },

    onItemCreate() {
      dispatch(act.item.create())
    },

    onItemImport(...args) {
      dispatch(act.item.import(...args))
    },

    onItemExport(items, meta) {
      dispatch(act.item.export(items, meta))
    },

    onItemDelete(items) {
      dispatch(act.item.delete(items))
    },

    onItemMerge(...args) {
      dispatch(act.item.merge(...args))
    },

    onItemPreview(...args) {
      dispatch(act.item.preview(...args))
    },

    onItemTagAdd(...args) {
      dispatch(act.item.tags.create(...args))
    },

    onItemTagRemove(...args) {
      dispatch(act.item.tags.delete(...args))
    },

    onMetadataSave(...args) {
      dispatch(act.metadata.save(...args))
      dispatch(act.edit.cancel())
    },

    onPhotoCreate(...args) {
      dispatch(act.photo.create(...args))
    },

    onPhotoMove(...args) {
      dispatch(act.photo.move(...args))
    },

    onPhotoConsolidate(...args) {
      dispatch(act.photo.consolidate(...args))
    },

    onPhotoError(...args) {
      dispatch(act.photo.error(...args))
    },

    onPhotoRotate(...args) {
      dispatch(act.photo.rotate(...args))
    },

    onPhotoSave(...args) {
      dispatch(act.photo.save(...args))
    },

    onPhotoSelect(...args) {
      dispatch(act.photo.select(...args))
    },

    onTagCreate(data) {
      dispatch(act.tag.create(data))
      dispatch(act.edit.cancel())
    },

    onTagSave(data, id) {
      dispatch(act.tag.save({ ...data, id }))
      dispatch(act.edit.cancel())
    },

    onTemplateImport(files) {
      dispatch(act.ontology.template.import({ files }, { prompt: true }))
    },

    onNoteCreate(...args) {
      dispatch(act.note.create(...args))
    },

    onNoteSave(...args) {
      dispatch(act.note.save(...args))
    },

    onNoteDelete(...args) {
      dispatch(act.note.delete(...args))
    },

    onNoteRestore(...args) {
      dispatch(act.note.delete(...args))
    },

    onNoteSelect(...args) {
      dispatch(act.note.select(...args))
    },

    onEdit(...args) {
      dispatch(act.edit.start(...args))
    },

    onEditCancel() {
      dispatch(act.edit.cancel())
    },

    onUiUpdate(...args) {
      dispatch(act.ui.update(...args))
    }
  })

)(DropTarget(DND.FILE, DropTargetSpec, (c, m) => ({
  connectDropTarget: c.dropTarget(),
  isOver: m.isOver(),
  canDrop: m.canDrop()
}))(Project))
