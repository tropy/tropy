import { useEffect, useMemo, useRef } from 'react'
import { useEvent } from './use-event.js'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'

function useLodash(method, fn, { wait = 250 } = {}) {
  let ref = useRef()
  let callback = useEvent(fn)

  useEffect(() => {
    ref.current = method(callback, wait)

    return () => {
      ref.current?.flush()
    }
  }, [method, callback, wait])

  return useMemo(() => Object.assign(
    (...args) => ref.current?.(...args),
    {
      flush: () => ref.current?.flush(),
      cancel: () => ref.current?.cancel()
    }
  ), [])
}

export function useDebounce(fn, opts) {
  return useLodash(debounce, fn, opts)
}

export function useThrottle(fn, opts) {
  return useLodash(throttle, fn, opts)
}
