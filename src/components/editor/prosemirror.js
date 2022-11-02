import { createRef, forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { bool, func, instanceOf, string } from 'prop-types'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { nodeViews } from '../../editor/schema.js'
import { useEvent } from '../../hooks/use-event.js'
import { useEventHandler } from '../../hooks/use-event-handler.js'
import { useTheme } from '../../hooks/use-theme.js'
import { stylesheet } from '../../dom.js'
import { isMeta } from '../../keymap.js'
import { StyleSheet } from '../../res.js'


export const ProseMirror = forwardRef(({
  isDisabled,
  isReadOnly,
  onBlur,
  onChange,
  onContextMenu,
  onFocus,
  onKeyDown,
  srcDoc,
  state
}, ref) => {
  let frame = createRef()
  let [view, setView] = useState()
  let theme = useTheme()

  let editable = useEvent(() =>
    !(isDisabled || isReadOnly))

  let handleLoad = useEvent(() => {
    setView(new EditorView(frame.current.contentDocument.body, {
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
        contextmenu: onContextMenu,
        focus: onFocus
      },
      handleKeyDown: onKeyDown,
      nodeViews,
      state
    }))
  })

  useEffect(() => (
    () => view?.destroy()
  ), [view])

  useEffect(() => {
    view?.updateState(state)
  }, [state, view])

  useImperativeHandle(ref, () => view, [view])

  // TODO handle container click (links)

  useEffect(() => {
    if (view != null) {
      let href = StyleSheet.expand(`editor-${theme}`)
      let html = view.dom.getRootNode()

      html.head.replaceChildren(stylesheet(href))
    }
  }, [theme, view])


  useEventHandler(document, 'dragstart', () => {
    frame.current.inert = true
  })
  useEventHandler(document, 'dragend', () => {
    frame.current.inert = false
  })


  return (
    <iframe
      ref={frame}
      className="prosemirror"
      srcDoc={srcDoc}
      onLoad={handleLoad}/>
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

  state: instanceOf(EditorState),
  srcDoc: string.isRequired
}

ProseMirror.defaultProps = {
  srcDoc: '<!DOCTYPE html><html><head></head><body></body></html>'
}
