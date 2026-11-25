import { useState } from 'react'
import { Cursor, toId } from '../common/sequence.js'

export function useCursor (seq, element) {
  let [layout, setLayout] = useState()
  return [new Cursor(seq, toId(element), layout), setLayout]
}
