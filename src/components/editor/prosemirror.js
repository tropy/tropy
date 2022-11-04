import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { bool, func, instanceOf, string } from 'prop-types'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import cx from 'classnames'
import { Frame } from '../frame.js'
import { nodeViews } from '../../editor/schema.js'
import { useEvent } from '../../hooks/use-event.js'
import { isMeta } from '../../keymap.js'


export const ProseMirror = forwardRef(({
  isDisabled,
  isReadOnly,
  mode,
  numbers,
  onBlur,
  onChange,
  onContextMenu,
  onFocus,
  onKeyDown,
  state,
  wrap
}, ref) => {
  let [view, setView] = useState()

  let editable = useEvent(() =>
    !(isDisabled || isReadOnly))

  let handleLoad = useEvent((doc) => {
    setView(new EditorView(doc.body, {
      editable,
      dispatchTransaction(tr) {
        onChange(this.state.apply(tr), tr.docChanged)
      },
      handleClick(v, pos, event) {
        if (!v.editable) v.dom.focus()
        return isMeta(event) // disable PM's block select
      },
      handleDOMEvents: {
        blur: onBlur,
        focus: onFocus
      },
      handleKeyDown: onKeyDown,
      nodeViews,
      state
    }))
  })

  let handleUnload = useEvent(() => {
    view.destroy()
    setView(null)
  })

  useEffect(() => {
    view?.updateState(state)
  }, [state, view])

  useImperativeHandle(ref, () => view, [view])

  // TODO handle container click (links)


  return (
    <Frame
      className="prosemirror"
      innerClassName={cx(mode, { numbers, wrap })}
      onContextMenu={onContextMenu}
      onLoad={handleLoad}
      onUnload={handleUnload}
      styleSheet="editor"/>
  )
})

ProseMirror.propTypes = {
  isDisabled: bool,
  isReadOnly: bool,
  // Subtle: event handlers are passed to PM on initialization
  // and they will not be updated. Use stable references!
  onBlur: func,
  onChange: func.isRequired,
  onContextMenu: func,
  onFocus: func,
  onKeyDown: func.isRequired,
  mode: string,
  numbers: bool,
  wrap: bool,

  state: instanceOf(EditorState)
}

ProseMirror.propTypes = {
  mode: 'horizontal',
  numbers: false,
  wrap: true
}
