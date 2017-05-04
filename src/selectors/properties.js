'use strict'

const { createSelector: memo } = require('reselect')
const { keys } = Object

const getPropertyURIs = memo(
  ({ properties }) => properties,
  (properties) => keys(properties).sort()
)


module.exports = {
  getPropertyURIs
}
