import { useLayoutEffect, useRef } from 'react'
import cx from 'classnames'

export const Modal = ({
  children,
  className,
  onClose
}) => {
  let dom = useRef()

  useLayoutEffect(() => {
    dom.current.showModal()
  }, [])

  let handleClose = async ({ target }) => {
    let { returnValue } = target

    await Promise.allSettled(
      target.getAnimations().map(a => a.finished))

    if (dom.current === target)
      onClose(returnValue)
  }

  return (
    <dialog
      ref={dom}
      className={cx('modal', className)}
      onClose={handleClose}>
      {children}
    </dialog>
  )
}
