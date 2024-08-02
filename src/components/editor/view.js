import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { EditorView as ProseMirror } from 'prosemirror-view'
import cx from 'classnames'
import { Frame } from '../frame.js'
import { isBlank, nodeViews } from '../../editor/index.js'
import { useEvent } from '../../hooks/use-event.js'
import { useIpcSend } from '../../hooks/use-ipc.js'
import { create, isLink } from '../../dom.js'
import { isMeta } from '../../keymap.js'


export const EditorView = forwardRef(({
  isDisabled,
  isReadOnly,
  direction = 'ltr',
  mode = 'horizontal',
  numbers = false,
  onBlur,
  onChange,
  onContextMenu,
  onFocus,
  onKeyDown,
  placeholder,
  state,
  wrap = true
}, ref) => {
  let [view, setView] = useState()
  let intl = useIntl()
  let open = useIpcSend(['shell', 'open'])

  let p = useMemo(() => (
    create('div', { class: 'placeholder' })
  ), [])

  let editable = useEvent(() =>
    !(isDisabled || isReadOnly))

  let handleClick = useEvent((event) => {
    if (!view.editable)
      view.focus()

    let link = isLink(event.target)

    if (link && isMeta(event)) {
      event.preventDefault()
      open(link.href)
    }
  })

  let handleLoad = useEvent((doc) => {
    setView(new ProseMirror(doc.body, {
      editable,
      dispatchTransaction(tr) {
        let next = this.state.apply(tr)

        if (this.composing)
          this.updateState(next)
        else
          onChange(next, tr.docChanged)
      },
      handleClick: (v, pos, event) => (
        isMeta(event) // Returning true prevents PM's block selection!
      ),
      handleDOMEvents: {
        blur: onBlur,
        compositionend(v, event) {
          onChange(v.state, !!event.data)
        },
        focus: onFocus
      },
      handleKeyDown: onKeyDown,
      nodeViews,
      state
    }))

    doc.body.prepend(p)
  })

  let handleUnload = useEvent(() => {
    view?.destroy()
    setView(null)
  })

  useEffect(() => {
    view?.updateState(state)
  }, [state, view])

  useEffect(() => {
    // Forces PM to re-evaluate the editable status!
    view?.setProps({})
  }, [isDisabled, isReadOnly, view])

  useImperativeHandle(ref, () => view, [view])

  useEffect(() => {
    p.textContent = intl.formatMessage({ id: placeholder })
  }, [placeholder, intl, p])

  useEffect(() => {
    p.style.display = (
      isDisabled || isReadOnly || !isBlank(state.doc)
    ) ? 'none' : 'block'
  }, [state, isDisabled, isReadOnly, p])


  return (
    <Frame
      className="prosemirror"
      innerClassName={cx(mode, direction, { numbers, wrap })}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onLoad={handleLoad}
      onUnload={handleUnload}
      styleSheet="editor"/>
  )
})
