import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { arrayOf, string } from 'prop-types'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar } from '../toolbar.js'
import { SearchField } from '../search/field.js'
import { ProjectFileList } from './file.js'
import project from '../../actions/project.js'
import { clear, consolidate, reload } from '../../slices/project-files.js'
import { match } from '../../collate.js'


export const RecentProjects = ({
  files
}) => {
  let dispatch = useDispatch()

  let [query, setQuery] = useState('')

  useEffect(() => {
    dispatch(reload(files))
  }, [files, dispatch])


  let projects = useSelector(state =>
    files
      .map(path => state.projectFiles[path])
      .filter(file =>
        file && (!query || match(file.name, query, /\b\p{Alpha}/gu))))

  let handleConsolidate = useEvent(path => {
    dispatch(consolidate(path))
      .then(action => {
        if (action?.payload?.newPath)
          handleProjectOpen(action.payload.newPath)
      })
  })

  let handleProjectRemove = useEvent(path => {
    dispatch(clear(path))
  })

  let handleProjectOpen = useEvent(path => {
    dispatch(project.open(path))
  })

  if (!files.length)
    return null

  return (
    <div className="recent-projects-view">
      <Titlebar isOptional/>
      <SearchField
        onSearch={setQuery}
        placeholder="project.recent.search.placeholder"
        query={query}/>
      <nav>
        <ProjectFileList
          files={projects}
          onConsolidate={handleConsolidate}
          onRemove={handleProjectRemove}
          onSelect={handleProjectOpen}/>
      </nav>
    </div>
  )
}

RecentProjects.propTypes = {
  files: arrayOf(string).isRequired
}
