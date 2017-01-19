'use strict'

const { pick } = require('../common/util')

const {
  createSelector: memo
} = require('reselect')

const list = ({ lists }, { list }) => lists[list]

const GetChildNodes = () =>
  memo(
    ({ lists }) => lists,
    (_, { parent }) => parent,

    (lists, parent) =>
      lists[parent] ? pick(lists, lists[parent].children) : {}
  )


module.exports = {
  list,
  GetChildNodes
}
