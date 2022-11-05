import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { bool, func, instanceOf, string } from 'prop-types'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import cx from 'classnames'
import { Frame } from '../frame.js'
import { isBlank, nodeViews } from '../../editor/index.js'
import { useEvent } from '../../hooks/use-event.js'
import { create } from '../../dom.js'
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
  placeholder,
  state,
  wrap
}, ref) => {
  let [view, setView] = useState()
  let intl = useIntl()

  let p = useMemo(() => (
    create('div', { class: 'placeholder' })
  ), [])

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

    doc.body.prepend(p)
  })

  let handleUnload = useEvent(() => {
    view.destroy()
    setView(null)
  })

  useEffect(() => {
    view?.updateState(state)
  }, [state, view])


  useImperativeHandle(ref, () => view, [view])

  useEffect(() => {
    p.textContent = intl.formatMessage({ id: placeholder })
  }, [placeholder, intl, p])

  useEffect(() => {
    p.style.display = (
      isDisabled || isReadOnly || !isBlank(state.doc)
    ) ? 'none' : 'block'
  }, [state, isDisabled, isReadOnly, p])

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
  mode: string,
  numbers: bool,
  // Subtle: event handlers are passed to PM on initialization
  // and they will not be updated. Use stable references!
  onBlur: func,
  onChange: func.isRequired,
  onContextMenu: func,
  onFocus: func,
  onKeyDown: func.isRequired,
  placeholder: string,
  state: instanceOf(EditorState),
  wrap: bool
}

ProseMirror.propTypes = {
  mode: 'horizontal',
  numbers: false,
  wrap: true
}
