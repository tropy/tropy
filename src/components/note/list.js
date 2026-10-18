import { useDispatch, useSelector } from 'react-redux'
import { List, ListItem } from '../sequence/list.js'
import { TABS, SASS } from '../../constants/index.js'
import * as act from '../../actions/index.js'

import {
  getSelectedNote,
  getSelectedPhoto,
  getVisibleNotes
} from '../../selectors/index.js'


export const NoteList = ({
  isItemOpen,
  isReadOnly,
  onContextMenu,
  rowHeight = SASS.NOTE.ROW_HEIGHT,
  tabIndex = TABS.NoteList
}) => {
  let dispatch = useDispatch()

  let notes = useSelector(getVisibleNotes)
  let selected = useSelector(getSelectedNote)
  let photo = useSelector(getSelectedPhoto)

  // Notes are not cleared.
  let handleSelect = (note, { throttle }) => {
    if (note == null)
      return

    dispatch(act.note.select({
      note: note.id,
      photo: note.photo,
      selection: note.selection
    }, { throttle }))
  }

  let handleOpen = (note) => {
    if (note != null && !isItemOpen)
      dispatch(act.item.open({
        id: photo.item,
        photos: [photo.id],
        notes: [note.id],
        selection: note.selection
      }))
  }

  let handleContextMenu = (event, note) => {
    onContextMenu?.(event, 'note', {
      notes: [note.id],
      item: note.item,
      photo: note.photo,
      selection: note.selection
    })
  }

  return (
    <List
      className="note-list"
      keymap="NoteList"
      rowHeight={rowHeight}
      scrollKeys="select"
      selection={selected}
      sequence={notes}
      tabAutoFocus={false}
      tabIndex={tabIndex}
      commands={{
        open ({ cursor }) {
          handleOpen(cursor.current())
        },
        remove: !isReadOnly && (({ cursor }) => {
          let note = cursor.current()

          if (note == null)
            return false

          dispatch(act.note.delete([note.id]))
        })
      }}
      onContextMenu={handleContextMenu}
      onOpen={handleOpen}
      onSelect={handleSelect}
      renderItem={(note, state) => (
        <ListItem {...state}>
          <div className="css-multiline-truncate">
            {note.text.slice(0, 280)}
          </div>
        </ListItem>
      )}/>
  )
}
