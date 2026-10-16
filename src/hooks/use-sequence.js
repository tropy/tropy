import { useState } from 'react'
import { Cursor } from '../common/sequence.js'

export function useSequence (seq, element) {
  let [layout, setLayout] = useState()
  let id = element?.id ?? element

  return {
    cursor: new Cursor(seq, id, layout),
    onLayoutChange: setLayout
  }
}
