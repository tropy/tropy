import { useArgs } from '../../hooks/use-args.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'

export const NoProject = () => {
  let recent = useArgs('recent')

  return (
    <div className="no-project">
      <RecentProjects files={recent.current}/>
      <NewProject/>
    </div>
  )
}
