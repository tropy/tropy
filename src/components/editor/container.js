import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'

import cx from 'classnames'
import { EditorToolbar } from './toolbar.js'
import { EditorView } from './view.js'
import { useEvent } from '../../hooks/use-event.js'
import { useDerivedState } from '../../hooks/use-derived-state.js'
import { commands, toEditorState, toText } from '../../editor/index.js'
import { getAlignment, getLink, getMarks } from '../../editor/state.js'
import { match } from '../../keymap.js'


export const Editor = React.forwardRef(({
  hasTitlebar,
  isDisabled,
  isReadOnly,
  direction = 'ltr',
  keymap,
  mode = 'horizontal',
  numbers = false,
  onBlur,
  onChange,
  onContextMenu,
  onCreate,
  placeholder,
  state: srcState,
  tabIndex = 1,
  wrap = true
}, ref) => {
  let container = useRef()
  let toolbar = useRef()
  let view = useRef()

  let [hasViewFocus, setViewFocus] = useState(false)

  let pendingCreation = useRef()

  useEffect(() => {
    if (srcState != null) {
      if (srcState === pendingCreation.current)
        onChange(view.current.state, true)

      pendingCreation.current = null
    }
  }, [srcState, onChange])

  let [state, setState] = useDerivedState(srcState, toEditorState)

  let [align, link, marks] = useMemo(() => ([
    getAlignment(state),
    getLink(state),
    getMarks(state)
  ]), [state])

  let exec = useEvent((action, ...args) =>
    commands[action]?.(
      view.current.state, view.current.dispatch, ...args
    ))

  let handleCommand = useEvent((...args) => {
    exec(...args)

    if (!view.current.hasFocus())
      view.current.focus()
  })

  let handleChange = useEvent((next, hasDocChanged) => {
    if (srcState == null) {
      setState(next)

      if (hasDocChanged && !pendingCreation.current && toText(next.doc)) {
        pendingCreation.current = next
        onCreate(next)
      }

    } else {
      onChange(next, hasDocChanged)
    }
  })

  let handleKeyDown = useEvent((_, event) => {
    if (isDisabled)
      return false

    let action = match(keymap, event)

    switch (action) {
      case null:
        return
      case 'addLink':
        toolbar.current.handleLinkButtonClick()
        break
      case 'lift':
        if (exec('liftListItem')) break
        // eslint-disable-next-line no-fallthrough
      default:
        if (!exec(action)) return
    }

    event.stopPropagation()
    return true
  })

  let handleContainerFocus = useEvent((event) => {
    if (event.target === container.current) {
      view.current.dom.focus()
    }
  })

  let handleViewFocus = useEvent(() => {
    setViewFocus(true)
  })

  let handleViewBlur = useEvent((event) => {
    setViewFocus(false)
    onBlur?.(event)
  })

  useImperativeHandle(ref, () => ({
    focus() {
      view.current.dom.focus()
    }
  }), [])

  return (
    <div
      ref={container}
      className={cx('editor', { 'is-blurred': !hasViewFocus })}
      tabIndex={isDisabled ? -1 : tabIndex}
      onContextMenu={onContextMenu}
      onFocus={handleContainerFocus}>
      <EditorToolbar
        ref={toolbar}
        align={align}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isTitlebar={hasTitlebar}
        link={link}
        marks={marks}
        onCommand={handleCommand}/>
      <EditorView
        ref={view}
        state={state}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        direction={direction}
        mode={mode}
        numbers={numbers}
        placeholder={placeholder}
        wrap={wrap}
        onFocus={handleViewFocus}
        onBlur={handleViewBlur}
        onChange={handleChange}
        onContextMenu={onContextMenu}
        onKeyDown={handleKeyDown}/>
    </div>
  )
})
