import { useEffect, useImperativeHandle, useState } from 'react'
import { useIntl } from 'react-intl'
import { EditorView as ProseMirror } from 'prosemirror-view'
import cx from 'classnames'
import { Frame } from '../frame.js'
import { isBlank, nodeViews } from '../../editor/index.js'
import { useEvent } from '../../hooks/use-event.js'
import { useIpcSend } from '../../hooks/use-ipc.js'
import { isLink } from '../../dom.js'
import { isMeta } from '../../keymap.js'
import { usePlaceholder } from './use-placeholder.js'


export const EditorView = ({
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
  ref,
  state,
  tabIndex,
  wrap = true
}) => {
  let [view, setView] = useState()
  let intl = useIntl()
  let open = useIpcSend(['shell', 'open'])

  let setPlaceholder = usePlaceholder({
    text: intl.formatMessage({ id: placeholder }),
    isVisible: !isDisabled && !isReadOnly && isBlank(state.doc)
  })

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
    let pm = new ProseMirror(doc.body, {
      editable,
      dispatchTransaction (tr) {
        let next = pm.state.apply(tr)

        if (pm.composing)
          pm.updateState(next)
        else
          onChange(next, tr.docChanged)
      },
      handleClick: (v, pos, event) => (
        isMeta(event) // Returning true prevents PM's block selection!
      ),
      handleDOMEvents: {
        blur: onBlur,
        compositionend (v, event) {
          onChange(v.state, !!event.data)
        },
        focus: onFocus
      },
      handleKeyDown: onKeyDown,
      nodeViews,
      state
    })

    setView(pm)
    setPlaceholder(doc)
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


  return (
    <Frame
      className="prosemirror"
      innerClassName={cx(mode, direction, { numbers, wrap })}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onLoad={handleLoad}
      onUnload={handleUnload}
      sandbox={false}
      styleSheet="editor"
      tabIndex={tabIndex}/>
  )
}
