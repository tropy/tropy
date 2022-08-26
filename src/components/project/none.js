import { useDispatch } from 'react-redux'
import { number } from 'prop-types'
import { useArgs } from '../../hooks/use-args.js'
import { useEvent } from '../../hooks/use-event.js'
import { useWindowSize } from '../../hooks/use-window-size.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'
import { Fade } from '../fx.js'
import project from '../../actions/project.js'

export const NoProject = ({
  height,
  width
}) => {
  let dispatch = useDispatch()
  let recent = useArgs('recent')

  useWindowSize(width * (recent.length ? 2 : 1), height)

  let handleProjectOpen = useEvent(path => {
    dispatch(project.open(path))
  })

  return (
    <Fade appear in>
      <div className="no-project">
        <RecentProjects
          files={recent}
          onSelect={handleProjectOpen}/>
        <NewProject
          onCreated={handleProjectOpen}/>
      </div>
    </Fade>
  )
}

NoProject.propTypes = {
  height: number.isRequired,
  width: number.isRequired
}

NoProject.defaultProps = {
  height: 580,
  width: 440
}
