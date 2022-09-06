import { extname } from 'node:path'
import React from 'react'
import { connect } from 'react-redux'
import { ProjectView } from './view'
import { NoProject } from './none.js'
import { ItemView } from '../item'
import { Fade, SwitchTransition } from '../fx.js'
import { DragLayer } from '../drag-layer'
import { DND, DropTarget, hasProjectFiles } from '../dnd.js'
import { MODE } from '../../constants/project.js'
import { emit, on, off, ensure, isInput, reflow } from '../../dom.js'
import cx from 'classnames'
import * as act from '../../actions'
import { match } from '../../keymap.js'

import {
  getSelectedItems,
  getSelectedPhoto,
  getSelectedNote,
  getVisibleNotes,
  getVisiblePhotos
} from '../../selectors'

import {
  arrayOf, oneOf, shape, bool, object, func, string, number
} from 'prop-types'

import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'

export const ProjectContainer = ({
  isWindowResizeAnimated,
  timeout
}) => {
  let dispatch = useDispatch()

  // let [, drop] = useDrop()

  let project = useSelector(state => state.project)

  let handleProjectOpen = useEvent(path => {
    dispatch(act.project.open(path))
  })

  return (
    <SwitchTransition>
      <Fade
        key={project.file ? 'project' : 'no-project'}
        enter={isWindowResizeAnimated}
        exit={false}
        timeout={timeout}>
        {project.file ?
          <Project
            project={project}
            isOver={false}/> :
          <NoProject
            onProjectOpen={handleProjectOpen}/>}
      </Fade>
    </SwitchTransition>
  )
}

ProjectContainer.propTypes = {
  isWindowResizeAnimated: bool,
  timeout: 300
}

class ProjectComponent extends React.Component {
  container = React.createRef()

  state = {
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

  componentDidUpdate({ nav, ui }) {
    if (nav.mode !== this.props.nav.mode) {
      this.modeWillChange()
    }

    if (ui.panel !== this.props.ui.panel) {
      this.setState({
        offset: this.props.ui.panel.width
      })
    }
  }

  componentWillUnmount() {
    off(document, 'keydown', this.handleKeyDown)
    off(document, 'global:back', this.handleBackButton)
    off(window, 'paste', this.handlePaste)
  }

  get classes() {
    const { isOver, canDrop, nav } = this.props
    const { mode, willModeChange, isModeChanging } = this.state

    return ['project', {
      closing: this.props.project.isClosing,
      over: isOver && canDrop,
      [`${mode}-mode`]: true,
      [`${mode}-mode-leave`]: willModeChange,
      [`${mode}-mode-leave-active`]: isModeChanging,
      [`${nav.mode}-mode-enter`]: willModeChange,
      [`${nav.mode}-mode-enter-active`]: isModeChanging
    }]
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

  handleBackButton = () => {
    if (this.state.mode !== MODE.PROJECT) {
      this.handleModeChange(MODE.PROJECT)
    }
  }

  handleModeChange = (mode) => {
    this.props.onModeChange(mode)
  }

  handlePanelResize = ({ value }) => {
    this.setState({ offset: value })
  }

  handlePanelDragStop = () => {
    this.props.onUiUpdate({
      panel: { width: Math.round(this.state.offset) }
    })
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

  render() {
    let { project, nav, ui } = this.props

    let isDisabled = this.state.mode !== MODE.PROJECT

    let isItemOpen = !!(
      this.state.mode === MODE.ITEM ^ this.state.isModeChanging
    )

    if (project.closed)
      return <div className="project closed"/>

    return (this.props.connectDropTarget(
      <div
        className={cx(this.classes)}
        ref={this.container}
        onContextMenu={this.props.onContextMenu}>

        <ProjectView
          isDisabled={isDisabled}
          offset={this.state.offset}
          onContextMenu={this.props.onContextMenu}
          project={project}/>

        <ItemView
          activeSelection={nav.selection}
          isItemOpen={isItemOpen}
          isProjectClosing={project.isClosing}
          isReadOnly={project.isReadOnly || nav.trash}
          items={this.props.selection}
          keymap={this.props.keymap}
          note={this.props.note}
          notes={this.props.notes}
          offset={this.state.offset}
          panel={ui.panel}
          photo={this.props.photo}
          photos={this.props.visiblePhotos}
          onContextMenu={this.props.onContextMenu}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onItemOpen={this.props.onItemOpen}
          onMetadataSave={this.props.onMetadataSave}
          onModeChange={this.props.onModeChange}
          onNoteCreate={this.props.onNoteCreate}
          onNoteDelete={this.props.onNoteDelete}
          onNoteSave={this.props.onNoteSave}
          onNoteSelect={this.props.onNoteSelect}
          onOpenInFolder={this.props.onOpenInFolder}
          onPanelDragStop={this.handlePanelDragStop}
          onPanelResize={this.handlePanelResize}
          onPhotoConsolidate={this.props.onPhotoConsolidate}
          onPhotoCreate={this.props.onPhotoCreate}
          onPhotoRotate={this.props.onPhotoRotate}
          onPhotoSave={this.props.onPhotoSave}
          onPhotoSelect={this.props.onPhotoSelect}
          onUiUpdate={this.props.onUiUpdate}/>

        <DragLayer/>
        <div className="cover"/>
      </div>
    ))
  }


  static propTypes = {
    project: shape({
      file: string
    }).isRequired,

    keymap: object.isRequired,

    selection: arrayOf(
      shape({ id: number.isRequired })
    ),

    photo: object,
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

    isOver: bool,
    canDrop: bool,
    connectDropTarget: func.isRequired,

    onContextMenu: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onItemOpen: func.isRequired,
    onMetadataSave: func.isRequired,
    onModeChange: func.isRequired,
    onNoteCreate: func.isRequired,
    onNoteDelete: func.isRequired,
    onNoteSave: func.isRequired,
    onNoteSelect: func.isRequired,
    onOpenInFolder: func.isRequired,
    onPhotoConsolidate: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoRotate: func.isRequired,
    onPhotoSave: func.isRequired,
    onPhotoSelect: func.isRequired,
    onProjectOpen: func.isRequired,
    onTemplateImport: func.isRequired,
    onUiUpdate: func.isRequired
  }
}


const DropTargetSpec = {
  drop({ onProjectOpen, onTemplateImport, project }, monitor) {
    let tpy = []
    let ttp = []

    for (let file of monitor.getItem().files) {
      switch (extname(file.path).toLowerCase()) {
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


export const Project = connect(
  state => ({
    edit: state.edit,
    keymap: state.keymap,
    nav: state.nav,
    note: getSelectedNote(state),
    notes: getVisibleNotes(state),
    photo: getSelectedPhoto(state),
    visiblePhotos: getVisiblePhotos(state),
    selection: getSelectedItems(state),
    templates: state.ontology.template,
    ui: state.ui
  }),

  dispatch => ({
    onContextMenu(event, ...args) {
      event.stopPropagation()
      dispatch(act.context.show(event, ...args))
    },

    onEdit(...args) {
      dispatch(act.edit.start(...args))
    },

    onEditCancel() {
      dispatch(act.edit.cancel())
    },

    onModeChange(mode) {
      dispatch(act.nav.update({ mode }))
    },

    onOpenInFolder(...args) {
      dispatch(act.shell.open(...args))
    },

    onProjectOpen(path) {
      dispatch(act.project.open(path))
    },

    onItemOpen(item) {
      dispatch(act.item.open(item))
    },

    onItemPreview(...args) {
      dispatch(act.item.preview(...args))
    },

    onMetadataSave(...args) {
      dispatch(act.metadata.save(...args))
    },

    onPhotoCreate(...args) {
      dispatch(act.photo.create(...args))
    },

    onPhotoConsolidate(...args) {
      dispatch(act.photo.consolidate(...args))
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

    onNoteSelect(...args) {
      dispatch(act.note.select(...args))
    },

    onUiUpdate(...args) {
      dispatch(act.ui.update(...args))
    }
  })

)(DropTarget(DND.FILE, DropTargetSpec, (c, m) => ({
  connectDropTarget: c.dropTarget(),
  isOver: m.isOver(),
  canDrop: m.canDrop()
}))(ProjectComponent))
