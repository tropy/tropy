import { useEffect } from 'react'
import { useWindow } from '../hooks/use-window.js'
import { useModal } from '../hooks/use-modal.js'

export function ModalLayer ({ modals }) {
  let win = useWindow()
  let modal = useModal()

  useEffect(() => {
    let unregister = Object.entries(modals).map(([type, component]) =>
      win.dialog.register(type, component))

    let detach = win.dialog.attach()

    return () => {
      detach()
      for (let fn of unregister) fn()
    }
  }, [win, modals])

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
