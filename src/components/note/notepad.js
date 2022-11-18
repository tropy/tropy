import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useSelector } from 'react-redux'
import { bool, func, number, object, shape, string } from 'prop-types'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { Editor } from '../editor/index.js'
import TABS from '../../constants/tabs.js'


export const NotePad = forwardRef(({
  hasTitlebar,
  isDisabled,
  isReadOnly,
  keymap,
  note,
  onChange,
  onCommit,
  onContextMenu,
  tabIndex
}, ref) => {

  let editor = useRef()

  useImperativeHandle(ref, () => ({
    focus() {
      editor.current.focus()
    }
  }), [])

  let { mode, numbers, wrap } = useSelector((state) =>
    state.notepad[note?.id] || Editor.defaultProps
  )

  let handleChange = useEvent((state, hasDocChanged) => {
    let text = (hasDocChanged) ?
      state.doc.textBetween(0, state.doc.content.size, ' ', ' ') :
      note.text

    onChange({ ...note, state, text }, hasDocChanged, text.length === 0)
  })

  let handleContextMenu = useEvent((event) => {
    if (!isDisabled && note?.id != null) {
      onContextMenu(event, 'notepad', {
        id: note.id,
        mode: mode,
        numbers: numbers,
        wrap: wrap
      })
    }
  })

  let handleEditorBlur = useEvent(() => {
    onCommit(note, note?.text.length === 0)
  })

  return (
    <section className={cx('note-pad', mode, {
      'disabled': isDisabled,
      'read-only': isReadOnly,
      'no-wrap': !wrap,
      'numbers': numbers
    })}>
      <Editor
        ref={editor}
        state={note?.state}
        keymap={keymap}
        mode={mode}
        numbers={numbers}
        wrap={wrap}
        placeholder="notepad.placeholder"
        hasTitlebar={hasTitlebar}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        tabIndex={tabIndex}
        onBlur={handleEditorBlur}
        onChange={handleChange}
        onContextMenu={handleContextMenu}/>
    </section>
  )
})

NotePad.propTypes = {
  hasTitlebar: bool,
  isDisabled: bool,
  isReadOnly: bool,
  keymap: object.isRequired,
  note: shape({
    id: number,
    state: object,
    text: string
  }),
  tabIndex: number.isRequired,
  onChange: func.isRequired,
  onCommit: func.isRequired,
  onContextMenu: func.isRequired
}

NotePad.defaultProps = {
  tabIndex: TABS.NotePad
}
