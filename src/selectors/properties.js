'use strict'

const { createSelector: memo } = require('reselect')
const { values } = Object
const { by } = require('../collate')
const byId  = by('id')

const getAllProperties = memo(
  ({ properties }) => properties,
  (properties) => values(properties).sort(byId)
)

module.exports = {
  getAllProperties
}
