import { useEffect, useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar } from '../toolbar.js'
import { SearchField } from '../search/field.js'
import { IconXLarge } from '../icons.js'
import { ProjectFileList } from './file.js'
import { clear, consolidate, reload } from '../../slices/project-files.js'
import { match } from '../../collate.js'
import { sanitizeSlug } from '../../common/slug.js'


export const RecentProjects = ({
  files,
  onSelect
}) => {
  let dispatch = useDispatch()

  let [query, setQuery] = useState('')

  let paths = useMemo(() => files.map(f => f.path), [files])

  useEffect(() => {
    dispatch(reload(paths))
  }, [paths, dispatch])

  let projectFiles = useSelector(state => state.projectFiles)

  let slugByPath = useMemo(() => {
    let map = new Map()
    for (let entry of files) {
      map.set(entry.path, entry.slug || sanitizeSlug(entry.name))
    }
    return map
  }, [files])

  let conflicts = useMemo(() => {
    let counts = new Map()
    for (let slug of slugByPath.values()) {
      counts.set(slug, (counts.get(slug) || 0) + 1)
    }
    let set = new Set()
    for (let [path, slug] of slugByPath) {
      if (counts.get(slug) > 1) set.add(path)
    }
    return set
  }, [slugByPath])

  let projects =
    files
      .map(entry => {
        let stats = projectFiles[entry.path]
        if (!stats) return null
        return {
          ...stats,
          slug: slugByPath.get(entry.path),
          hasConflict: conflicts.has(entry.path)
        }
      })
      .filter(file => file &&
        (!query || match(file.name, query, /\b\p{Alpha}/gu)))

  let handleConsolidate = useEvent(path => {
    dispatch(consolidate(path))
      .then(action => {
        if (action?.payload?.newPath)
          onSelect?.(action.payload.newPath)
      })
  })

  let handleProjectRemove = useEvent(path => {
    dispatch(clear(path))
  })

  if (!files.length)
    return null

  return (
    <div className="recent-projects-view">
      <Titlebar isOptional/>
      <SearchField
        onSearch={setQuery}
        placeholder="project.recent.search.placeholder"
        clearIcon={<IconXLarge/>}
        query={query}/>
      {!projects.length ? (
        <div className="placeholder">
          <FormattedMessage id="project.recent.search.blank"/>
        </div>
      ) : (
        <nav>
          <ProjectFileList
            files={projects}
            onConsolidate={handleConsolidate}
            onRemove={handleProjectRemove}
            onSelect={onSelect}/>
        </nav>
      )}
    </div>
  )
}
