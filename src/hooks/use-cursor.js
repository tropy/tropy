import { useState } from 'react'
import { Cursor } from '../common/sequence.js'

export function useCursor (seq, element) {
  let [layout, setLayout] = useState()
  let id = element?.id ?? element

  return [new Cursor(seq, id, layout), setLayout]
}
