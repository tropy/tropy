'use strict'

const {
  createSelector: memo
} = require('reselect')

const {
  into, compose, map, filter
} = require('transducers.js')


const tx = (parent, tmp) =>
  compose(
    map(([, list]) => list),
    // eslint-disable-next-line eqeqeq
    filter(list => list.parent == parent && list.tmp == tmp))

const children = () =>
  memo(
    ({ lists }) => lists,
    (_, { parent }) => parent,
    (_, { tmp }) => tmp,

    (lists, parent, tmp) =>
      into([], tx(parent, tmp), lists)
        .sort((a, b) => a - b)
  )


module.exports = {
  children
}
