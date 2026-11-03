import { blank } from '../common/util.js'
import { createIndex } from '../common/sequence.js'

export function pluck (data, ids) {
  let res = []
  let idx = createIndex(res)

  if (!blank(ids)) {
    for (const id of ids) {
      const item = data[id]
      if (item == null || item.pending) continue
      idx.set(id, res.length)
      res.push(item)
    }
  }

  return res
}
