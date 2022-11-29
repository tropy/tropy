import { useEffect, useMemo, useRef } from 'react'
import { useEvent } from './use-event.js'
import debounce from 'lodash.debounce'

export function useDebounce(fn, { wait = 250 } = {}) {
  let ref = useRef()
  let callback = useEvent(fn)

  useEffect(() => {
    ref.current = debounce(callback, wait)

    return () => {
      ref.current?.flush()
    }
  }, [callback, wait])

  return useMemo(() => Object.assign(
    (...args) => ref.current?.(...args),
    {
      flush: () => ref.current?.flush(),
      cancel: () => ref.current?.cancel()
    }
  ), [])
}
