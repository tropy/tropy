import React, { useEffect, useImperativeHandle, useRef } from 'react'
import Esper from '../../esper/index.js'

export const EsperView = React.forwardRef(({
  children,
  onResize
}, ref) => {
  let view = useRef()

  useImperativeHandle(ref, () => (Esper.instance), [])

  useEffect(() => {
    Esper.instance.mount(view.current)

    return () => {
      Esper.instance.destroy()
    }
  }, [])

  useEffect(() => {
    let ro = new ResizeObserver(([e]) => {
      onResize(e.contentRect)
    })
    ro.observe(view.current)

    return () => {
      ro.disconnect()
    }
  }, [onResize])

  return (
    <div className="esper-view-container">
      <div className="esper-view" ref={view}/>
      {children}
    </div>
  )
})
