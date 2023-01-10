import { useReducer, useRef } from 'react'
import { identity } from '../common/util.js'

const next = (_, state) => (state)

// Like useState but updates the state when the prop changes
export function useDerivedState(prop, derive = identity) {
  let ref = useRef(prop)
  let [value, setValue] = useReducer(next, prop, derive)

  if (prop !== ref.current) {
    ref.current = prop
    setValue(derive(prop))
  }

  return [value, setValue]
}
