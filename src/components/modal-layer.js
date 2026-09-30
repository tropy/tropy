import { useEffect } from 'react'
import { useWindow } from '../hooks/use-window.js'
import { useModal } from '../hooks/use-modal.js'

export function ModalLayer () {
  let win = useWindow()
  let modal = useModal()

  useEffect(() => win.dialog.attach(), [win])

  if (modal == null)
    return null

  let { id, type, options } = modal
  let Component = win.dialog.modals[type]

  return (
    <Component
      key={id}
      {...options}
      onClose={(result) => win.dialog.close(id, result)}/>
  )
}
