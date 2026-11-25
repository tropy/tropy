import { blank } from '../common/util.js'
import { createSequence } from '../common/sequence.js'

export function pluck (data, ids) {
  let res = createSequence()

  if (!blank(ids)) {
    for (const id of ids) {
      const item = data[id]
      if (item == null || item.pending) continue
      res.push(item)
    }
  }

  return res
}
