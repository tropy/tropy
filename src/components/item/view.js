import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ItemPanelGroup } from './panel.js'
import { ItemContainer } from './container.js'
import { Resizable } from '../resizable.js'
import { SASS } from '../../constants/index.js'
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
  let style = useMemo(() => ({
    transform: `translate3d(${
      isItemMode ? 0 : `calc(100% - ${offset}px)`
    }, 0, 0)`
  }), [isItemMode, offset])

  // TODO these should be moved!
  // ------------------------------------------------------------
  let items = useSelector(getSelectedItems)
  let note = useSelector(getSelectedNote)
  let photo = useSelector(getSelectedPhoto)
  let photos = useSelector(getVisiblePhotos)
  let notes = useSelector(getVisibleNotes)
  let keymap = useSelector(state => state.keymap)

  let [
    handleEdit,
    handleEditCancel,
    handleMetadataSave,
    handlePhotoCreate,
    handlePhotoSave,
    handlePhotoSelect,
    handlePhotoTranscribe,
    handleUiUpdate
  ] = useActions([
    'edit.start', 'edit.cancel',
    'metadata.save',
    'photo.create', 'photo.save', 'photo.select',
    'transcriptions.create',
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
          onMetadataSave={handleMetadataSave}
          onPhotoCreate={handlePhotoCreate}
          onPhotoSave={handlePhotoSave}
          onPhotoSelect={handlePhotoSelect}
          onPhotoTranscribe={handlePhotoTranscribe}
          onUiUpdate={handleUiUpdate}
          panel={panel}
          photo={photo}
          photos={photos}/>
      </Resizable>
      <ItemContainer
        note={note}
        photo={photo}
        isDisabled={!isItemMode || isProjectClosing}
        isReadOnly={isReadOnly}
        onContextMenu={onContextMenu}
        onPhotoSave={handlePhotoSave}
        onPhotoSelect={handlePhotoSelect}
        onUiUpdate={handleUiUpdate}/>
    </section>
  )
}
