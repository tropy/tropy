'use strict'

const { blank } = require('../common/util')

const pluck = (data, ids) => {
  const idx = {}
  const res = []

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

module.exports = {
  pluck
}
