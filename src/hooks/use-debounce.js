import { useEffect, useMemo, useRef } from 'react'
import debounce from 'lodash.debounce'

export function useDebounce(fn, { wait = 250 } = {}) {
  let ref = useRef()

  useEffect(() => {
    if (typeof fn === 'function')
      ref.current = debounce(fn, wait)
    else
      ref.current = null

    return () => {
      ref.current?.flush()
    }
  }, [fn, wait])

  return useMemo(() => Object.assign(
    (...args) => ref.current?.(...args),
    {
      flush: () => ref.current?.flush(),
      cancel: () => ref.current?.cancel()
    }
  ), [])
}
