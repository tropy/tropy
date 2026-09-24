import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import cx from 'classnames'
import { on, off } from '../../dom.js'
import { useDebounce } from '../../hooks/use-debounce.js'
import { useEvent } from '../../hooks/use-event.js'
import { useResizeObserver } from '../../hooks/use-resize-observer.js'


const useScrollHandler = (dom, {
  onScroll,
  onScrollStart,
  onScrollStop
}) => {
  let isScrolling = useRef(false)
  let isEnabled = !!(onScroll || onScrollStart || onScrollStop)

  let handleScrollStop = useDebounce(() => {
    if (isScrolling.current) {
      isScrolling.current = false
      onScrollStop?.()
    }
  }, { wait: 150 })

  let handleScroll = useEvent((event) => {
    if (!isScrolling.current) {
      isScrolling.current = true
      onScrollStart?.(event)
    }

    onScroll?.(event)
    handleScrollStop()
  })

  useLayoutEffect(() => {
    if (!isEnabled)
      return

    let node = dom.current
    on(node, 'scroll', handleScroll)

    return () => {
      off(node, 'scroll', handleScroll)
    }
  }, [dom, isEnabled, handleScroll, handleScrollStop])
}


export const ScrollContainer = ({
  children,
  className,
  onBlur,
  onClick,
  onFocus,
  onKeyDown,
  onResize,
  onScroll,
  onScrollStart,
  onScrollStop,
  onWheel,
  ref,
  tabIndex
}) => {
  let dom = useRef()

  useResizeObserver(dom, onResize)

  useScrollHandler(dom, {
    onScroll,
    onScrollStart,
    onScrollStop
  })

  useImperativeHandle(ref, () => dom.current, [])

  return (
    <div
      ref={dom}
      className={cx('scroll-container', className)}
      onBlur={onBlur}
      onClick={(event) => {
        if (event.target === dom.current) onClick?.(event)
      }}
      onFocus={onFocus}
      onKeyDown={tabIndex != null ? onKeyDown : null}
      onWheel={onWheel}
      tabIndex={tabIndex ?? -1}>
      {children}
    </div>
  )
}
