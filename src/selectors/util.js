import { blank } from '../common/util'

export function pluck(data, ids) {
  let idx = {}
  let res = []

  if (!blank(ids)) {
    for (const id of ids) {
      const item = data[id]
      if (item == null || item.pending) continue
      idx[id] = res.length
      res.push(item)
    }
  }

  res.idx = idx
  return res
}
