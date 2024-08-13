import React, { useCallback } from 'react'
import cx from 'classnames'
import { TABS } from '../../constants/index.js'
import { useEvent } from '../../hooks/use-event.js'
import { useIntersectionObserver } from '../../hooks/use-intersection-observer.js'
import { useMouseTracking } from '../../hooks/use-mouse-tracking.js'

export const EsperContainer = React.forwardRef(({
  children,
  className,
  hasOverlayToolbar = false,
  isDisabled,
  onEnter,
  onLeave,
  tabIndex = TABS.Esper,
  ...props
}, ref) => {

  let observe = useIntersectionObserver({ onEnter, onLeave })
  let [mouseover, track] = useMouseTracking()

  let onMount = useCallback((node) => {
    if (ref) ref.current = node
    observe(node)
    track(hasOverlayToolbar ? node : null)
  }, [ref, observe, track, hasOverlayToolbar])

  let handleMouseDown = useEvent(() => {
    if (!isDisabled && document.activeElement !== ref?.current)
      ref?.current.focus()
  })

  return (
    <section
      {...props}
      className={cx('esper', className, {
        'disabled': isDisabled,
        mouseover,
        'overlay-mode': hasOverlayToolbar
      })}
      onMouseDown={handleMouseDown}
      ref={onMount}
      tabIndex={isDisabled ? -1 : tabIndex}>
      {children}
    </section>
  )
})
