import { useCallback, useState } from 'react'

// Like useState, but resets when prop changes.

export function useDraftState (prop) {
  let [draft, setDraft] = useState({ prop, value: prop })

  let setState = useCallback((value) => {
    setDraft(prev => ({ prop: prev.prop, value }))
  }, [])

  if (!Object.is(draft.prop, prop)) {
    setDraft({ prop, value: prop })
    return [prop, setState]
  }

  return [draft.value, setState]
}
