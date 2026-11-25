import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { List, ListItem } from '../sequence/list.js'
import { Highlight } from '../highlight.js'
import { snippet } from '../../common/matcher.js'
import { selectMatcher } from '../../slices/qr.js'
import { TABS, SASS } from '../../constants/index.js'
import * as act from '../../actions/index.js'

import {
  selectActiveNoteIds,
  selectNoteCursor
} from '../../slices/nav/selectors.js'


export const NoteList = ({
  isItemOpen,
  isReadOnly,
  onContextMenu,
  rowHeight = SASS.NOTE.ROW_HEIGHT,
  tabIndex = TABS.NoteList
}) => {
  let dispatch = useDispatch()

  let noteIds = useSelector(selectActiveNoteIds)
  let selection = useSelector(selectNoteCursor)

  // Notes are not cleared.
  let handleSelect = (id, { throttle }) => {
    if (id != null)
      dispatch(act.nav.select.note({ note: id }, { throttle }))
  }

  let handleOpen = (id) => {
    if (id != null && !isItemOpen)
      dispatch(act.nav.open.item({ note: id }))
  }

  let handleContextMenu = (event, id) => {
    onContextMenu?.(event, 'note', { notes: [id] })
  }

  return (
    <List
      className="note-list"
      keymap="NoteList"
      rowHeight={rowHeight}
      scrollKeys="select"
      selection={selection}
      sequence={noteIds}
      tabAutoFocus={false}
      tabIndex={tabIndex}
      commands={{
        open ({ cursor }) {
          handleOpen(cursor.current())
        },
        remove: !isReadOnly && (({ cursor }) => {
          let id = cursor.current()

          if (id == null)
            return false

          dispatch(act.note.delete([id]))
        })
      }}
      onContextMenu={handleContextMenu}
      onOpen={handleOpen}
      onSelect={handleSelect}
      renderItem={(id, state) => (
        <NoteListItem {...state} id={id}/>
      )}/>
  )
}

const NoteListItem = ({ id, ...state }) => {
  let note = useSelector(s => s.notes[id])
  let isMatch = useSelector(s => !!s.qr.contributors?.notes[id])
  let matcher = useSelector(selectMatcher)

  return (
    <ListItem {...state} className={cx({ match: isMatch })}>
      {note != null && (
        <div className="css-multiline-truncate">
          <Preview text={note.text} matcher={matcher}/>
        </div>
      )}
    </ListItem>
  )
}

// The note's beginning, or its matches of the search query.
const Preview = ({ text, matcher }) => {
  let ranges = matcher?.ranges(text, 'note')

  return ranges?.length ?
    <Highlight {...snippet(text, ranges)}/> :
    text.slice(0, 280)
}
