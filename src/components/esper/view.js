import React, { useCallback, useEffect, useImperativeHandle } from 'react'
import Esper from '../../esper/index.js'
import { useResizeObserver } from '../../hooks/use-resize-observer.js'

export const EsperView = React.forwardRef(({
  children,
  onResize
}, ref) => {

  let handleResize = useResizeObserver(onResize)

  let onMount = useCallback((node) => {
    if (node) {
      Esper.instance.mount(node)
    } else {
      Esper.instance.unmount()
    }
    handleResize(node)
  }, [handleResize])

  useImperativeHandle(ref, () => (
    Esper.instance
  ), [])

  useEffect(() => (
    Esper.instance.destroy
  ), [])

  return (
    <div className="esper-view-container">
      <div ref={onMount} className="esper-view"/>
      {children}
    </div>
  )
})
