import { useMemo, useRef, useState } from 'react'
import cx from 'classnames'
import { func, bool, object, number, string } from 'prop-types'
import { EditorToolbar } from './toolbar.js'
import { EditorView } from './view.js'
import { useEvent } from '../../hooks/use-event.js'
import { commands, toEditorState } from '../../editor/index.js'
import { match } from '../../keymap.js'


export function Editor({
  hasTitlebar,
  isDisabled,
  isReadOnly,
  keymap,
  mode,
  numbers,
  onBlur,
  onChange,
  onContextMenu,
  placeholder,
  state,
  tabIndex,
  wrap
}) {
  let container = useRef()
  let toolbar = useRef()
  let view = useRef()

  let [hasViewFocus, setViewFocus] = useState(false)

  state = useMemo(() => toEditorState(state), [state])

  let exec = useEvent((action, ...args) =>
    commands[action]?.(
      view.current.state, view.current.dispatch, ...args
    ))

  let handleCommand = useEvent((...args) => {
    exec(...args)

    if (!view.current.hasFocus())
      view.current.focus()
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
      view.current.focus()
    }
  })

  let handleViewFocus = useEvent(() => {
    setViewFocus(true)
  })

  let handleViewBlur = useEvent((event) => {
    setViewFocus(false)
    onBlur?.(event)
  })

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
        onChange={onChange}
        onContextMenu={onContextMenu}
        onKeyDown={handleKeyDown}/>
    </div>
  )
}

Editor.propTypes = {
  hasTitlebar: bool,
  isDisabled: bool,
  isReadOnly: bool,
  keymap: object.isRequired,
  mode: string.isRequired,
  numbers: bool,
  onBlur: func.isRequired,
  onChange: func.isRequired,
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
