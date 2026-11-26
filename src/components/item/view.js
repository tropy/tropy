import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ItemPanelGroup } from './panel.js'
import { ItemContainer } from './container.js'
import { Resizable } from '../resizable.js'
import { SASS } from '../../constants/index.js'
import { useActions } from '../../hooks/use-action.js'
import { useDebouncedValue } from '../../hooks/use-debounce.js'

import {
  selectActiveItemIds,
  selectActiveNoteIds,
  selectActivePhotoIds,
  selectCursorNote,
  selectCursorPhoto,
  selectItemCursor,
  selectPhotoCursor
} from '../../slices/nav/selectors.js'


export const ItemView = ({
  inert,
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

  // In project mode debounce updating Esper and notepad.
  let note = useSelector(selectCursorNote)
  let photoCursor = useSelector(selectPhotoCursor)
  let photo = useSelector(selectCursorPhoto)

  let settled = useDebouncedValue({ photoCursor, note, photo }, {
    wait: isItemMode ? 0 : 500,
    shallow: true
  })

  // TODO these should be moved!
  // ------------------------------------------------------------
  let items = useSelector(selectActiveItemIds)
  let item = useSelector(selectItemCursor)
  let photos = useSelector(selectActivePhotoIds)
  let notes = useSelector(selectActiveNoteIds)
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
    'photo.create', 'photo.save', 'nav.select.photo',
    'transcriptions.create',
    'ui.update'
  ])
  // ------------------------------------------------------------


  return (
    <section className="item-view" inert={inert} style={style}>
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
          item={item}
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
        photoCursor={settled.photoCursor}
        note={settled.note}
        photo={settled.photo}
        isDisabled={!isItemMode || isProjectClosing}
        isReadOnly={isReadOnly}
        onContextMenu={onContextMenu}
        onPhotoSave={handlePhotoSave}
        onPhotoSelect={handlePhotoSelect}
        onUiUpdate={handleUiUpdate}/>
    </section>
  )
}
