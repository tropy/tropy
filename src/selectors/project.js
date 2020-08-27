import { join } from 'path'
import { createSelector as memo } from 'reselect'
import ARGS from '../args'

export const getCachePrefix = memo(
  (state) => state.project,
  (project) => (ARGS.cache) ? join(ARGS.cache, `${project.id}`) : null
)
