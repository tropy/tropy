import { useLayoutEffect, useMemo, useRef } from 'react'

// Placeholder until React.useEvent is available!

export function useEvent(callback) {
  let ref = useRef()

  useLayoutEffect(() => {
    ref.current = callback
  })

  return useMemo(() => (...args) => ref.current?.(...args), [])
}
