import { useMemo, useState } from 'react'
import { useEvent } from './use-event.js'
import { identity } from '../common/util.js'

// Like useState, but updates when prop changes.
// NB: `derive` should be a stable reference!

export function useDerivedState (prop, derive = identity) {
  let [override, setOverride] = useState()
  let derived = useMemo(() => derive(prop), [prop, derive])

  let value = (override?.prop === prop) ? override.value : derived

  let setValue = useEvent((next) => {
    setOverride({ prop, value: next })
  })

  return [value, setValue]
}
