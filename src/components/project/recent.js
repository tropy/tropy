import { useDispatch } from 'react-redux'
import ARGS from '../../args.js'
import { Titlebar } from '../toolbar.js'
import { SearchField } from '../search/field.js'
import { ProjectFileList } from './file.js'
import project from '../../actions/project.js'

export const RecentProjects = () => {
  let dispatch = useDispatch()
  let files = ARGS.recent

  return (
    <div className="recent-projects-view">
      <Titlebar isOptional/>
      <SearchField/>
      <nav>
        <ProjectFileList
          files={files}
          onClick={path => dispatch(project.open(path))}/>
      </nav>
    </div>
  )
}
