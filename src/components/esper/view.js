import React, { useCallback, useImperativeHandle } from 'react'
import Esper from '../../esper/index.js'
import { useResizeObserver } from '../../hooks/use-resize-observer.js'

export const EsperView = React.forwardRef(({
  children,
  onResize
}, ref) => {

  useImperativeHandle(ref, () => (
    Esper.instance
  ), [Esper.instance])

  let observe = useResizeObserver(onResize)

  let mount = useCallback((node) => {
    if (node) {
      Esper.instance.mount(node)
    } else {
      Esper.instance.destroy()
    }
    observe(node)
  }, [])

  return (
    <div className="esper-view-container">
      <div ref={mount} className="esper-view"/>
      {children}
    </div>
  )
})
