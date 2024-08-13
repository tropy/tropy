import { useEffect, useState } from 'react'
import { getResolution, onResolutionChange } from '../dom.js'

export function useResolution() {
  let [state, setState] = useState(getResolution)

  useEffect(() => (
    onResolutionChange(setState)
  ), [])

  return state
}
