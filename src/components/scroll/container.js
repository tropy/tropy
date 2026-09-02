import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import cx from 'classnames'
import { debounce } from '../../common/util.js'
import { on, off } from '../../dom.js'
import { useEvent } from '../../hooks/use-event.js'
import { useResizeObserver } from '../../hooks/use-resize-observer.js'


const useScrollHandler = (dom, {
  onScroll,
  onScrollStart,
  onScrollStop,
  peer
}) => {
  let didSync = useRef(false)
  let isScrolling = useRef(false)
  let stop = useRef()

  // Subtle: adjusting the scroll position triggers a scroll event,
  // so we flag it, or else we would echo it back to the peer container!
  let sync = useEvent((y, x) => {
    let node = dom.current

    if (y != null && y !== node.scrollTop) {
      didSync.current = true
      node.scrollTop = y
    }

    if (x != null && x !== node.scrollLeft) {
      didSync.current = true
      node.scrollLeft = x
    }
  })

  let handleScrollStop = useEvent(() => {
    isScrolling.current = false
    onScrollStop?.()
  })

  let hasEdges = onScrollStart != null || onScrollStop != null

  let handleScroll = useEvent((event) => {
    if (hasEdges && !isScrolling.current) {
      isScrolling.current = true
      onScrollStart?.(event)
    }

    onScroll?.(event)

    if (peer?.current && !didSync.current)
      peer.current.sync(null, dom.current.scrollLeft)

    didSync.current = false

    // Subtle: this restarts the timer on every single event, so we
    // track the end of scrolling only if anyone is listening!
    if (hasEdges)
      stop.current()
  })

  let isEnabled = !!(onScroll || peer) || hasEdges

  useLayoutEffect(() => {
    if (!isEnabled)
      return

    let node = dom.current

    if (hasEdges)
      stop.current = debounce(handleScrollStop, 150)

    on(node, 'scroll', handleScroll)

    return () => {
      off(node, 'scroll', handleScroll)

      stop.current?.flush()
      stop.current = null
    }
  }, [dom, isEnabled, hasEdges, handleScroll, handleScrollStop])

  return sync
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
  ref,
  sync,
  tabIndex
}) => {
  let dom = useRef()

  useResizeObserver(dom, onResize)

  let syncScroll = useScrollHandler(dom, {
    onScroll,
    onScrollStart,
    onScrollStop,
    peer: sync
  })

  useImperativeHandle(ref, () => ({
    get bounds () {
      let { clientWidth, clientHeight } = dom.current

      return {
        width: clientWidth,
        height: clientHeight
      }
    },

    get scrollTop () {
      return dom.current.scrollTop
    },

    get scrollLeft () {
      return dom.current.scrollLeft
    },

    focus () {
      dom.current.focus()
    },

    scroll (y, x) {
      if (y != null)
        dom.current.scrollTop = y
      if (x != null)
        dom.current.scrollLeft = x
    },

    scrollBy (y, x) {
      this.scroll(
        y != null ? this.scrollTop + y : null,
        x != null ? this.scrollLeft + x : null
      )
    },

    sync: syncScroll
  }), [syncScroll])

  return (
    <div
      ref={dom}
      className={cx('scroll-container', className)}
      onBlur={onBlur}
      onClick={onClick && ((event) => {
        if (event.target === dom.current) onClick()
      })}
      onFocus={onFocus}
      onKeyDown={tabIndex != null ? onKeyDown : null}
      tabIndex={tabIndex ?? -1}>
      {children}
    </div>
  )
}
