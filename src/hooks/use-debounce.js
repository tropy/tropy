import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { shallowEqual } from 'react-redux'
import { useEvent } from './use-event.js'
import { debounce, throttle } from '../common/util.js'

function useLodash (method, fn, { wait = 250 } = {}) {
  let ref = useRef()
  let callback = useEvent(fn)

  useLayoutEffect(() => {
    ref.current = method(callback, wait)

    return () => {
      ref.current?.flush()
    }
  }, [method, callback, wait])

  return useMemo(() => {
    let proxy = (...args) => ref.current?.(...args)
    proxy.flush = () => ref.current?.flush()
    proxy.cancel = () => ref.current?.cancel()

    return proxy
  }, [])
}

export function useDebounce (fn, opts) {
  return useLodash(debounce, fn, opts)
}

export function useThrottle (fn, opts) {
  return useLodash(throttle, fn, opts)
}

export function useDebouncedValue (value, {
  wait = 250,
  shallow = false
} = {}) {
  let [current, setCurrent] = useState(value)
  let [debounced, setDebounced] = useState(value)

  if (!(shallow ? shallowEqual : Object.is)(current, value))
    setCurrent(value)

  useEffect(() => {
    let timer = setTimeout(() => {
      setDebounced(current)
    }, wait)

    return () => clearTimeout(timer)
  }, [current, wait])

  return (wait > 0) ? debounced : value
}
