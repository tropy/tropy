import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { arrayOf, string } from 'prop-types'
import { Titlebar } from '../toolbar.js'
import { SearchField } from '../search/field.js'
import { ProjectFileList } from './file.js'
import project from '../../actions/project.js'
import { reload } from '../../slices/project-files.js'
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

  let handleConsolidate = () => {
    // TODO
    // open filepicker in dirname(path)
    // if file picked: remove old path from recent list and open new path
  }

  let handleRemove = () => {
    // TODO
    // send path to main thread for removal
    // have main thread update ARGS
  }

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
          onClick={path => dispatch(project.open(path))}
          onRemove={handleRemove}/>
      </nav>
    </div>
  )
}

RecentProjects.propTypes = {
  files: arrayOf(string).isRequired
}
