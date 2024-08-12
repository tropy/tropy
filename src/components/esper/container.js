import React, { useEffect, useCallback, useImperativeHandle, useRef } from 'react'
import cx from 'classnames'
import { TABS } from '../../constants/index.js'
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
  // let container = useRef()

  // useImperativeHandle(ref, () => ({
  //   focus() {
  //     container.current.focus()
  //   }
  // }), [])

  let observe = useIntersectionObserver({ onEnter, onLeave })
  let [mouseover, track] = useMouseTracking()

  let mount = useCallback((node) => {
    ref.current = node
    observe(node)
    track(hasOverlayToolbar ? node : null)
  }, [observe, track, hasOverlayToolbar])

  return (
    <section
      {...props}
      className={cx('esper', className, {
        'disabled': isDisabled,
        mouseover,
        'overlay-mode': hasOverlayToolbar
      })}
      ref={mount}
      tabIndex={isDisabled ? -1 : tabIndex}>
      {children}
    </section>
  )
})
