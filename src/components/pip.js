import React, { useEffect, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'
import { bool, func, node, number } from 'prop-types'
import { useEvent } from '../hooks/use-event.js'
import { usePipWindow } from '../hooks/use-pip.js'
import { append, create, remove } from '../dom.js'


export const PictureInPicture = React.forwardRef(({
  isVisible,
  children,
  width,
  height,
  onHide
}, ref) => {
  let [container, setContainer] = useState(null)

  let handleShow = useEvent(() => {
    let div = create('div', { className: 'pip-container' })
    append(div, pip.current.document.body)
    setContainer(div)
  })

  let handleHide = useEvent(() => {
    remove(container)
    setContainer(null)
    onHide?.()
  })

  let [pip, show] = usePipWindow({
    width,
    height,
    onShow: handleShow,
    onHide: handleHide
  })

  useImperativeHandle(ref, () => ({
    show,
    hide() { pip.current?.close() }
  }), [pip, show])

  useEffect(() => {
    isVisible ? show() : pip.current?.close()
  }, [isVisible, pip, show])

  return container != null && (
    createPortal(children, container)
  )
})

PictureInPicture.propTypes = {
  isVisible: bool,
  children: node,
  width: number,
  height: number,
  onHide: func
}
