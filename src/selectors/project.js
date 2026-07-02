import { join } from 'node:path'
import { createSelector } from 'reselect'
import ARGS from '../args.js'

export const selectCachePrefix = createSelector(
  (state) => state.project?.id,
  (id) => (ARGS.cache && id) ? join(ARGS.cache, id) : null
)
