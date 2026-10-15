import { useId, useLayoutEffect, useState } from 'react'
import { toggle } from '../dom.js'

// Shows nodeRef using the Popover API.
// Use anchor for CSS anchor positioning.
//
// NB: node and anchor are expected to be stable for the component lifetime!
//
// Returns isReady when popover is ready to show content.

export function usePopover (nodeRef, { anchor: anchorRef } = {}) {
  let isReady = useShowPopover(nodeRef)

  useLayoutEffect(() => {
    toggle(document.documentElement, 'popover-open', true)

    return () => {
      toggle(document.documentElement, 'popover-open', false)
    }
  }, [])

  // CSS links popover to anchor by global anchor name!
  let anchorName = `--popover-${CSS.escape(useId())}`

  useLayoutEffect(() => {
    if (anchorRef == null)
      return

    let popover = nodeRef.current
    let source = anchorRef.current
    source.style.anchorName = anchorName
    popover.style.positionAnchor = anchorName

    return () => {
      source.style.anchorName = ''
      popover.style.positionAnchor = ''
    }
  }, [nodeRef, anchorRef, anchorName])

  return isReady
}

export function useShowPopover (nodeRef, method = 'showPopover') {
  let [isReady, setReady] = useState(false)

  useLayoutEffect(() => {
    nodeRef.current[method]()
    setReady(true)
  }, [nodeRef, method])

  return isReady
}
