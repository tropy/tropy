import { join } from 'node:path'
import { createSelector } from 'reselect'
import ARGS from '../args.js'
import { protocolURL } from '../common/url.js'

export const selectCachePrefix = createSelector(
  (state) => state.project?.id,
  (id) => (ARGS.cache && id) ? join(ARGS.cache, id) : null
)

export const selectProject = createSelector(
  (state) => state.project,
  (project) => ({ ...project, url: protocolURL(project.path) })
)
