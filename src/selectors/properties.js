'use strict'

const { createSelector: memo } = require('reselect')
const { values } = Object
const { by } = require('../collate')
const byURI  = by('uri')

const getAllProperties = memo(
  ({ properties }) => properties,
  (properties) => values(properties).sort(byURI)
)

module.exports = {
  getAllProperties
}
