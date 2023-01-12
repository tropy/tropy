import { useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { ItemPanelGroup } from './panel'
import { ItemContainer } from './container'
import { Resizable } from '../resizable'
import { SASS } from '../../constants'

import {
  arrayOf, bool, func, object, number, shape
} from 'prop-types'

import { useActions } from '../../hooks/use-action.js'

import {
  getSelectedItems,
  getSelectedNote,
  getSelectedPhoto,
  getVisibleNotes,
  getVisiblePhotos
} from '../../selectors/index.js'


export const ItemView = ({
  isItemMode,
  isProjectClosing,
  isReadOnly,
  offset,
  onContextMenu,
  onPanelDragStop,
  onPanelResize,
  panel
}) => {

  let itemContainer = useRef()

  let style = useMemo(() => ({
    transform: `translate3d(${
      isItemMode ? 0 : `calc(100% - ${offset}px)`
    }, 0, 0)`
  }), [isItemMode, offset])

  let handleNoteCreate = useEvent(() => {
    let delay = 50

    if (!isItemMode) {
      delay += 800
      handleItemOpen({
        id: items[0].id,
        photos: [photo.id],
        selection: activeSelection
      })
    }

    if (note) {
      handleNoteSelect()
    }

    setTimeout(itemContainer.current.focusNotePad, delay)
  })

  // TODO these should be moved!
  // ------------------------------------------------------------
  let items = useSelector(getSelectedItems)
  let note = useSelector(getSelectedNote)
  let photo = useSelector(getSelectedPhoto)
  let photos = useSelector(getVisiblePhotos)
  let notes = useSelector(getVisibleNotes)
  let keymap = useSelector(state => state.keymap)
  let activeSelection = useSelector(state => state.nav.selection)

  let [
    handleEdit,
    handleEditCancel,
    handleItemOpen,
    handleMetadataSave,
    handleNoteDelete,
    handleNoteSelect,
    handlePhotoCreate,
    handlePhotoConsolidate,
    handlePhotoSave,
    handlePhotoSelect,
    handleUiUpdate
  ] = useActions([
    'edit.start', 'edit.cancel',
    'item.open',
    'metadata.save',
    'note.delete', 'note.select',
    'photo.create', 'photo.consolidate', 'photo.save', 'photo.select',
    'ui.update'
  ])
  // ------------------------------------------------------------


  return (
    <section className="item-view" style={style}>
      <Resizable
        edge={isItemMode ? 'right' : 'left'}
        value={offset}
        min={SASS.PANEL.MIN_WIDTH}
        max={SASS.PANEL.MAX_WIDTH}
        onResize={onPanelResize}
        onDragStop={onPanelDragStop}>
        <ItemPanelGroup
          isDisabled={isProjectClosing}
          isItemMode={isItemMode}
          isReadOnly={isReadOnly}
          items={items}
          keymap={keymap}
          note={note}
          notes={notes}
          onContextMenu={onContextMenu}
          onEdit={handleEdit}
          onEditCancel={handleEditCancel}
          onItemOpen={handleItemOpen}
          onNoteCreate={handleNoteCreate}
          onNoteDelete={handleNoteDelete}
          onNoteSelect={handleNoteSelect}
          onMetadataSave={handleMetadataSave}
          onPhotoConsolidate={handlePhotoConsolidate}
          onPhotoCreate={handlePhotoCreate}
          onPhotoSave={handlePhotoSave}
          onPhotoSelect={handlePhotoSelect}
          onUiUpdate={handleUiUpdate}
          panel={panel}
          photo={photo}
          photos={photos}/>
      </Resizable>
      <ItemContainer
        ref={itemContainer}
        note={note}
        photo={photo}
        isDisabled={!isItemMode || isProjectClosing}
        isReadOnly={isReadOnly}
        onContextMenu={onContextMenu}
        onPhotoConsolidate={handlePhotoConsolidate}
        onPhotoCreate={handlePhotoCreate}
        onPhotoSave={handlePhotoSave}
        onPhotoSelect={handlePhotoSelect}
        onUiUpdate={handleUiUpdate}/>
    </section>
  )
}

ItemView.propTypes = {
  items: arrayOf(
    shape({
      id: number.isRequired,
      tags: arrayOf(number),
      deleted: bool
    })
  ),

  keymap: object.isRequired,
  offset: number.isRequired,
  panel: object,
  activeSelection: number,
  note: object,
  photo: object,
  isItemMode: bool.isRequired,
  isProjectClosing: bool,
  isReadOnly: bool,

  onContextMenu: func.isRequired,
  onItemOpen: func.isRequired,
  onNoteDelete: func.isRequired,
  onNoteSave: func.isRequired,
  onNoteSelect: func.isRequired,
  onPhotoConsolidate: func.isRequired,
  onPhotoCreate: func.isRequired,
  onPhotoSave: func.isRequired,
  onPanelResize: func.isRequired,
  onPanelDragStop: func.isRequired
}
