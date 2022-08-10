import { useDispatch } from 'react-redux'
import ARGS from '../../args.js'
import { Titlebar } from '../toolbar.js'
import { SearchField } from '../search/field.js'
import { ProjectFileList } from './file.js'
import project from '../../actions/project.js'

export const RecentProjects = () => {
  let dispatch = useDispatch()

  let files = ARGS.recent
  // TODO add useArgs that handles ARGS updates

  let handleConsolidate = (path) => {
    // TODO
    // open filepicker in dirname(path)
    // if file picked: remove old path from recent list and open new path
  }

  let handleRemove = (path) => {
    // TODO
    // send path to main thread for removal
    // have main thread update ARGS
  }

  return (
    <div className="recent-projects-view">
      <Titlebar isOptional/>
      <SearchField/>
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
