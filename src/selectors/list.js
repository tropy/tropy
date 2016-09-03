'use strict'

const {
  createSelector: memo
} = require('reselect')

const values = require('object.values')


const lists = ({ lists }) => lists

const root = memo([lists], (lists) => values(lists))

module.exports = {
  lists,
  root
}
