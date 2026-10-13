import { useRef } from 'react'
import cx from 'classnames'
import { has } from '../dom.js'
import { usePopover } from '../hooks/use-popover.js'

export const Popup = ({
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
      className={cx('popup-container', { anchored: anchor != null })}>
      {isReady && (
        <div
          className={cx('popup', className, { 'fade-in': fadeIn })}
          style={style}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}>
          {children}
        </div>
      )}
    </div>
  )
}
