import { useLayoutEffect, useRef, useState } from 'react'
import cx from 'classnames'

export const Modal = ({
  children,
  className,
  closedBy,
  onClose
}) => {
  let dom = useRef()
  let submission = useRef(null)
  let [isOpen, setOpen] = useState(false)

  // Subtle: mount children only after the dialog is open,
  // otherwise React's autoFocus has no effect.
  useLayoutEffect(() => {
    dom.current.showModal()
    setOpen(true)
  }, [])

  let handleSubmit = ({ target, nativeEvent: { submitter } }) => {
    submission.current = {
      cancel: false,
      value: submitter?.value ?? null,
      data: fromFormData(new FormData(target))
    }
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
      onSubmit={handleSubmit}
      onClose={handleClose}>
      {isOpen && children}
    </dialog>
  )
}

function fromFormData (formData) {
  let data = {}

  for (let [name, value] of formData) {
    data[name] = Object.hasOwn(data, name) ?
      [].concat(data[name], value) :
      value
  }

  return data
}
