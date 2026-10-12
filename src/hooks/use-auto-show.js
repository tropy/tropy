import { useLayoutEffect, useState } from 'react'

export function useAutoShow (ref, method = 'showPopover') {
  let [isReady, setReady] = useState(false)

  useLayoutEffect(() => {
    ref.current[method]()
    setReady(true)
  }, [ref, method])

  return isReady
}
