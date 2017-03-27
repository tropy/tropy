'use strict'

const { seq, keep, compose, map, filter } = require('transducers.js')

const isNotPending = (data) => !data.pending

const pluck = (data, ids) =>
  seq(ids, compose(
    map(id => data[id]),
    keep(),
    filter(isNotPending)
  ))

module.exports = {
  isNotPending,
  pluck
}
