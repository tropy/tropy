import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ARGS from '../../args.js'
import { Titlebar } from '../toolbar.js'
import { SearchField } from '../search/field.js'
import { ProjectFileList } from './file.js'
import project from '../../actions/project.js'
import { reload } from '../../slices/project-files.js'
import { match } from '../../collate.js'


export const RecentProjects = () => {
  let dispatch = useDispatch()

  let [query, setQuery] = useState('')

  let recent = ARGS.recent
  // TODO add useArgs that handles ARGS updates (or get via window context?)

  useEffect(() => {
    dispatch(reload(recent))
  }, [recent, dispatch])


  let files = useSelector(state =>
    recent
      .map(path => state.projectFiles[path])
      .filter(file => file && (!query || match(file.name, query))))

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

  return (
    <div className="recent-projects-view">
      <Titlebar isOptional/>
      <SearchField
        onSearch={setQuery}
        query={query}/>
      <nav>
        <ProjectFileList
          files={files}
          onConsolidate={handleConsolidate}
          onClick={path => dispatch(project.open(path))}
          onRemove={handleRemove}/>
      </nav>
    </div>
  )
}
