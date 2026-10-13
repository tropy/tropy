import { useRef } from 'react'
import cx from 'classnames'
import { has } from '../dom.js'
import { usePopover } from '../hooks/use-popover.js'

export const Popover = ({
  children,
  className,
  fadeIn = false,
  anchor,
  style
}) => {
  let dom = useRef()
  let isReady = usePopover(dom, { anchor })

  let handleMouseDown = (event) => {
    // Keep the focus when clicking to scroll.
    if (has(event.target, 'scroll-container')) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  let handleContextMenu = (event) => {
    event.stopPropagation()
    event.preventDefault()
  }

  return (
    <div
      ref={dom}
      popover="manual"
      className={cx('popover-container', { anchored: anchor != null })}
      style={style}>
      {isReady && (
        <div
          className={cx('popover', className, { 'fade-in': fadeIn })}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}>
          {children}
        </div>
      )}
    </div>
  )
}
