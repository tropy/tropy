'use strict'

const { join } = require('path')
const { createSelector: memo } = require('reselect')

const getCachePrefix = memo(
  (state) => state.project,
  (project) => (ARGS.cache) ? join(ARGS.cache, `${project.id}`) : null
)

module.exports = {
  getCachePrefix
}
