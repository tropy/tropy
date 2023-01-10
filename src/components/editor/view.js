import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { bool, func, instanceOf, string } from 'prop-types'
import { EditorState } from 'prosemirror-state'
import { EditorView as ProseMirror } from 'prosemirror-view'
import cx from 'classnames'
import { Frame } from '../frame.js'
import { isBlank, nodeViews } from '../../editor/index.js'
import { useEvent } from '../../hooks/use-event.js'
import { useOpenExternal } from '../../hooks/use-open-external.js'
import { create, isLink } from '../../dom.js'
import { isMeta } from '../../keymap.js'


export const EditorView = forwardRef(({
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
  let openExternal = useOpenExternal()

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
      openExternal(link.href)
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
    view.destroy()
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
      innerClassName={cx(mode, { numbers, wrap })}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onLoad={handleLoad}
      onUnload={handleUnload}
      styleSheet="editor"/>
  )
})

EditorView.propTypes = {
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

EditorView.propTypes = {
  mode: 'horizontal',
  numbers: false,
  wrap: true
}
