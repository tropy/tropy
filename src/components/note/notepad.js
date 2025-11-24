import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { Editor } from '../editor/index.js'
import { toText } from '../../editor/serialize.js'
import TABS from '../../constants/tabs.js'
import actions from '../../actions/note.js'

export const NotePad = ({
  hasTitlebar,
  isDisabled,
  isReadOnly,
  keymap,
  note,
  onContextMenu,
  tabIndex = TABS.NotePad
}) => {
  let dispatch = useDispatch()
  let editor = useRef()

  isReadOnly = isReadOnly || isDisabled
  let isBlank = note?.id && !note.text

  useGlobalEvent('note-open', () => {
    editor.current.focus()
  })

  let {
    direction = 'ltr',
    mode = 'horizontal',
    numbers = false,
    wrap = true
  } = useSelector(({ notepad }) => notepad[note?.id]) || {}

  let handleCreate = useEvent((state) => {
    dispatch(actions.create({
      state,
      text: toText(state.doc)
    }))
  })

  let handleChange = useEvent((state, hasDocChanged) => {
    dispatch(actions.update({
      id: note.id,
      state,
      text: hasDocChanged ? toText(state.doc) : note.text
    }))
  })

  let handleContextMenu = useEvent((event) => {
    onContextMenu(event, 'notepad', {
      id: isDisabled ? null : note?.id,
      direction,
      mode,
      numbers,
      wrap
    })
  })

  let handleUnload = useEvent((id, wasBlank) => {
    if (wasBlank && id !== note?.id)
      dispatch(actions.delete([id]))
  })

  useEffect(() => {
    return () => {
      handleUnload(note?.id, isBlank)
    }
  }, [note?.id, isBlank, handleUnload])


  return (
    <section className="note-pad">
      <Editor
        ref={editor}
        state={note?.state}
        direction={direction}
        keymap={keymap}
        mode={mode}
        numbers={numbers}
        wrap={wrap}
        placeholder="notepad.placeholder"
        hasTitlebar={hasTitlebar}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        tabIndex={tabIndex}
        onChange={handleChange}
        onContextMenu={handleContextMenu}
        onCreate={handleCreate}/>
    </section>
  )
}
