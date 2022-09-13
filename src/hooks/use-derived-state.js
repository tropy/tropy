import { useRef, useState } from 'react'

// Like useState but updates the state when the prop changes
export function useDerivedState(prop) {
  let ref = useRef(prop)
  let [value, setValue] = useState(prop)

  if (prop !== ref.current) {
    ref.current = prop
    setValue(prop)
  }

  return [value, setValue]
}
