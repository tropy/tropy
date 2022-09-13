import React from 'react'
import { bool, number } from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { useActions } from '../../hooks/use-action.js'
import { useDerivedState } from '../../hooks/use-derived-state.js'
import { useTransitionState } from '../../hooks/use-transition-state.js'
import { useEvent } from '../../hooks/use-event.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useGlobalKeys } from '../../hooks/use-global-keys.js'
import { ProjectView } from './view.js'
import { ItemView } from '../item/view.js'
import { DragLayer } from '../drag-layer.js'
import { MODE } from '../../constants/project.js'
import * as act from '../../actions/index.js'

import {
  getSelectedItems,
  getSelectedNote,
  getSelectedPhoto,
  getVisibleNotes,
  getVisiblePhotos
} from '../../selectors/index.js'


const modeToString = (mode) =>
  `${mode}-mode`


export const ProjectClosed = () =>
  <div className="project closed"/>


export const Project = React.forwardRef(({
  isOver,
  project,
  timeout
}, drop) => {

  let dispatch = useDispatch()

  let nav = useSelector(state => state.nav)
  let [mode, container] = useTransitionState(nav.mode, timeout, modeToString)

  let keymap = useSelector(state => state.keymap.global)
  useGlobalKeys(keymap)

  useGlobalEvent('back', () => {
    if (mode.current !== MODE.PROJECT) {
      dispatch(act.nav.update({ mode: MODE.PROJECT }))
    }
  })

  // TODO use event propagation instead of passing down callback!
  let handleContextMenu = useEvent((event, ...args) => {
    event.stopPropagation()
    dispatch(act.context.show(event, ...args))
  })

  let panel = useSelector(state => state.ui.panel)
  let [offset, setOffset] = useDerivedState(panel.width)

  let handlePanelResize = useEvent(({ value }) => {
    setOffset(value)
  })

  let handlePanelDragStop = useEvent(() => {
    dispatch(act.ui.update({
      panel: { width: Math.round(offset) }
    }))
  })

  // TODO these should be moved!
  // ------------------------------------------------------------
  let items = useSelector(getSelectedItems)
  let photo = useSelector(getSelectedPhoto)
  let photos = useSelector(getVisiblePhotos)
  let note = useSelector(getSelectedNote)
  let notes = useSelector(getVisibleNotes)

  let [
    handleEdit,
    handleEditCancel,
    handleItemOpen,
    handleItemPreview,
    handleMetadataSave,
    handleNoteCreate,
    handleNoteDelete,
    handleNoteSave,
    handleNoteSelect,
    handleOpenInFolder,
    handlePhotoCreate,
    handlePhotoConsolidate,
    handlePhotoSave,
    handlePhotoSelect,
    handlePhotoRotate,
    handleUiUpdate
  ] = useActions([
    'edit.start', 'edit.cancel',
    'item.open', 'item.preview',
    'metadata.save',
    'note.create', 'note.save', 'note.delete', 'note.select',
    'shell.open',
    'photo.create', 'photo.consolidate', 'photo.save', 'photo.select', 'photo.rotate',
    'ui.update'
  ])

  let handleModeChange = useEvent((value) => {
    dispatch(act.nav.update({ mode: value }))
  })

  // ------------------------------------------------------------

  let isItemMode = !!(
    (mode.current === MODE.ITEM) ^ mode.isChanging
  )

  if (project.closed)
    return <ProjectClosed/>

  drop?.(container)

  return (
    <div
      ref={container}
      className={cx('project', mode.className, {
        closing: project.isClosing,
        over: isOver
      })}
      onContextMenu={handleContextMenu}>

      <ProjectView
        isDisabled={isItemMode}
        offset={offset}
        onContextMenu={handleContextMenu}
        project={project}/>

      <ItemView
        activeSelection={nav.selection}
        isDisabled={!isItemMode}
        isProjectClosing={project.isClosing}
        isReadOnly={project.isReadOnly || nav.trash}
        items={items}
        keymap={keymap}
        note={note}
        notes={notes}
        offset={offset}
        panel={panel}
        photo={photo}
        photos={photos}
        onContextMenu={handleContextMenu}
        onEdit={handleEdit}
        onEditCancel={handleEditCancel}
        onItemOpen={handleItemOpen}
        onItemPreview={handleItemPreview}
        onMetadataSave={handleMetadataSave}
        onModeChange={handleModeChange}
        onNoteCreate={handleNoteCreate}
        onNoteDelete={handleNoteDelete}
        onNoteSave={handleNoteSave}
        onNoteSelect={handleNoteSelect}
        onOpenInFolder={handleOpenInFolder}
        onPanelDragStop={handlePanelDragStop}
        onPanelResize={handlePanelResize}
        onPhotoConsolidate={handlePhotoConsolidate}
        onPhotoCreate={handlePhotoCreate}
        onPhotoRotate={handlePhotoRotate}
        onPhotoSave={handlePhotoSave}
        onPhotoSelect={handlePhotoSelect}
        onUiUpdate={handleUiUpdate}/>

      <DragLayer/>
      <div className="cover"/>
    </div>
  )
})

Project.propTypes = {
  isOver: bool,
  project: bool,
  timeout: number
}

Project.defaultProps = {
  timeout: 3000
}
