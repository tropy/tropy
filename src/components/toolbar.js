import { forwardRef, useRef } from 'react'
import { bool, func, node, string } from 'prop-types'
import cx from 'classnames'
import { useWindow } from '../hooks/use-window.js'
import { useEvent } from '../hooks/use-event.js'
import { has, repaint } from '../dom.js'

export const Toolbar = forwardRef((props, ref) => (
  <div
    ref={ref}
    className={cx('toolbar', 'tb-target', props.className)}
    onDoubleClick={props.onDoubleClick}
    onTransitionEnd={props.onTransitionEnd}>
    {props.children}
  </div>
))

Toolbar.propTypes = {
  children: node,
  className: string,
  onDoubleClick: func,
  onTransitionEnd: func
}

Toolbar.Context = forwardRef((props, ref) => (
  <div
    ref={ref}
    className={cx('toolbar-context', 'tb-target', props.className, {
      active: props.isActive
    })}>
    {props.children}
  </div>
))

Toolbar.Context.propTypes = {
  children: node,
  className: string,
  isActive: bool
}


Toolbar.Left = ({ children, className }) => (
  <div className={cx('toolbar-left', 'tb-target', className)}>
    {children}
  </div>
)

Toolbar.Left.propTypes = {
  children: node,
  className: string
}

Toolbar.Center = ({ children, className }) => (
  <div className={cx('toolbar-center', 'tb-target', className)}>
    {children}
  </div>
)

Toolbar.Center.propTypes = {
  children: node,
  className: string
}

Toolbar.Right = ({ children, className }) => (
  <div className={cx('toolbar-right', 'tb-target', className)}>
    {children}
  </div>
)

Toolbar.Right.propTypes = {
  children: node,
  className: string
}


export const ToolGroup = ({ children }) =>
  <div className="tool-group">{children}</div>

ToolGroup.propTypes = {
  children: node
}


export const Titlebar = ({ children, isOptional }) => {
  let win = useWindow()
  let ref = useRef()

  let handleDoubleClick = useEvent((event) => {
    if (win.args.frameless && has(event.target, 'tb-target'))
      win.send('titlebar-action', 'double-click')
  })

  // Hack: Electron sometimes fails to update the app-region
  // after transitions (e.g., when hide/showing a titlebar).
  let handleTransitionEnd = useEvent((event) => {
    if (win.args.frameless && event.target === ref.current)
      repaint(event.target)
  })

  let handleMouseDown = useEvent((event) => {
    if (win.args.frameless && has(event.target, 'tb-target'))
      if (event.button === 2)
        win.send('titlebar-action', 'right-click')
      else if (event.button === 1)
        win.send('titlebar-action', 'middle-click')
  })

  if (isOptional && !win.args.frameless)
    return null

  return (
    <Toolbar
      ref={ref}
      className="titlebar"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onTransitionEnd={handleTransitionEnd}>
      {children}
    </Toolbar>
  )
}

Titlebar.propTypes = {
  children: node,
  isOptional: bool
}
