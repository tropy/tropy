'use strict'

const { join } = require('path')
const { createSelector: memo } = require('reselect')

const getCachePrefix = memo(
  (state) => state.project,
  (project) => join(ARGS.cache, `${project.id}`)
)

module.exports = {
  getCachePrefix
}
