import { useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar } from '../toolbar.js'
import { SearchField } from '../search/field.js'
import { IconXLarge } from '../icons.js'
import { ProjectFileList } from './file.js'
import { clear, consolidate, reload } from '../../slices/project-files.js'
import { match } from '../../collate.js'


export const RecentProjects = ({
  files,
  onSelect
}) => {
  let dispatch = useDispatch()

  let [query, setQuery] = useState('')

  useEffect(() => {
    dispatch(reload(files))
  }, [files, dispatch])

  let projectFiles = useSelector(state => state.projectFiles)
  let projects =
    files
      .map(path => projectFiles[path])
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
