import ARGS from '../../args.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'

export const NoProject = () => {
  let recent = ARGS.recent
  // TODO add useArgs that handles ARGS updates (or get via window context?)

  return (
    <div className="no-project">
      <RecentProjects files={recent}/>
      <NewProject/>
    </div>
  )
}
