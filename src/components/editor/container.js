import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import cx from 'classnames'
import { func, bool, object, number, string } from 'prop-types'
import { EditorToolbar } from './toolbar.js'
import { EditorView } from './view.js'
import { useEvent } from '../../hooks/use-event.js'
import { useDerivedState } from '../../hooks/use-derived-state.js'
import { commands, toEditorState, toText } from '../../editor/index.js'
import { match } from '../../keymap.js'


export const Editor = React.forwardRef(({
  hasTitlebar,
  isDisabled,
  isReadOnly,
  keymap,
  mode,
  numbers,
  onBlur,
  onChange,
  onContextMenu,
  onCreate,
  placeholder,
  state: srcState,
  tabIndex,
  wrap
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
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isTitlebar={hasTitlebar}
        state={state}
        ref={toolbar}
        onCommand={handleCommand}/>
      <EditorView
        ref={view}
        state={state}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
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

Editor.propTypes = {
  hasTitlebar: bool,
  isDisabled: bool,
  isReadOnly: bool,
  keymap: object.isRequired,
  mode: string.isRequired,
  numbers: bool,
  onBlur: func.isRequired,
  onChange: func.isRequired,
  onCreate: func,
  onContextMenu: func,
  placeholder: string,
  state: object,
  tabIndex: number.isRequired,
  wrap: bool
}

Editor.defaultProps = {
  mode: 'horizontal',
  numbers: false,
  tabIndex: -1,
  wrap: true
}
