import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { bool, func, number, object, shape, string } from 'prop-types'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { Editor } from '../editor/index.js'
import { toText } from '../../editor/serialize.js'
import TABS from '../../constants/tabs.js'
import actions from '../../actions/note.js'


export const NotePad = forwardRef(({
  hasTitlebar,
  isDisabled,
  isReadOnly,
  keymap,
  note,
  onContextMenu,
  tabIndex
}, ref) => {

  let dispatch = useDispatch()
  let editor = useRef()

  isReadOnly = isReadOnly || isDisabled
  let isBlank = note?.id && !note.text

  useImperativeHandle(ref, () => ({
    focus() {
      editor.current.focus()
    }
  }), [])

  let { mode, numbers, wrap } = useSelector(({ notepad }) =>
    notepad[note?.id] || Editor.defaultProps
  )

  useEffect(() => {
    return () => {
      if (isBlank)
        dispatch(actions.delete([note.id]))
    }
  }, [note?.id, isBlank, dispatch])

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
    if (!isDisabled && note?.id != null) {
      onContextMenu(event, 'notepad', {
        id: note.id,
        mode: mode,
        numbers: numbers,
        wrap: wrap
      })
    }
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
        onChange={handleChange}
        onContextMenu={handleContextMenu}
        onCreate={handleCreate}/>
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
  onContextMenu: func.isRequired
}

NotePad.defaultProps = {
  tabIndex: TABS.NotePad
}
