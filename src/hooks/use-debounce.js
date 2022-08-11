import { useEffect, useMemo, useRef } from 'react'
import debounce from 'lodash.debounce'

export function useDebounce(fn, { wait = 250 } = {}) {
  let ref = useRef()

  useEffect(() => {
    console.log('useDebounce :: debounce')
    ref.current = debounce(fn, wait)

    return () => {
      ref.current?.flush()
    }
  }, [fn, wait])

  return useMemo(() => {
    console.log('useDebounce :: inside useMemo')
    let debounced = (...args) => ref.current?.(...args)

    debounced.flush = () => ref.current?.flush()
    debounced.cancel = () => ref.current?.cancel()

    return debounced
  }, [])
}
