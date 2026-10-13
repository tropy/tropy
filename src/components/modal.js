import { useRef } from 'react'
import cx from 'classnames'
import { useShowPopover } from '../hooks/use-popover.js'

export const Modal = ({
  children,
  className,
  closedBy,
  onClose
}) => {
  let dom = useRef()
  let submission = useRef(null)
  let isReady = useShowPopover(dom, 'showModal')

  let handleSubmit = ({ target, nativeEvent: { submitter } }) => {
    submission.current = {
      cancel: false,
      value: submitter?.value ?? null,
      data: fromFormData(new FormData(target))
    }
  }

  // Subtle: the modal is rendered inside the view,
  // so React events still reach the view's handlers.
  // Keep context menus from going through.
  let handleContextMenu = (event) => {
    event.stopPropagation()
  }

  let handleClose = async ({ target }) => {
    let form = target.querySelector('form')
    let result = submission.current ?? {
      cancel: true,
      value: null,
      data: form ? fromFormData(new FormData(form)) : null
    }

    await Promise.allSettled(
      target.getAnimations().map(a => a.finished))

    if (dom.current === target)
      onClose(result)
  }

  return (
    <dialog
      ref={dom}
      className={cx('modal', className)}
      closedby={closedBy}
      onContextMenu={handleContextMenu}
      onSubmit={handleSubmit}
      onClose={handleClose}>
      {isReady && children}
    </dialog>
  )
}

function fromFormData (formData) {
  let data = {}

  for (let [name, value] of formData) {
    data[name] = Object.hasOwn(data, name)
      ? [].concat(data[name], value)
      : value
  }

  return data
}
