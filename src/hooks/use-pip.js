/* global documentPictureInPicture */

import { useEffect, useRef } from 'react'
import { useEvent } from './use-event.js'

export function usePipWindow({ width, height, onShow, onHide }) {
  let pip = useRef()

  let show = useEvent(() => {
    if (pip.current || show.isPending)
      return

    show.isPending = true

    documentPictureInPicture
      .requestWindow({ width, height })
      .then((win) => {
        win.addEventListener('pagehide', () => {
          pip.current = null
          onHide?.(win)
        })

        // TODO add top-level class
        // TODO add stylesheets

        pip.current = win
        onShow?.(win)
      })
      .catch(console.log) // TODO
      .finally(() => show.isPending = false)
  })

  useEffect(() => {
    if (pip.current) {
      // TODO update width/height if necessary
    }
  }, [width, height])

  useEffect(() => pip.current?.close(), [])

  return [pip, show]
}
