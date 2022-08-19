import { number } from 'prop-types'
import { useArgs } from '../../hooks/use-args.js'
import { useWindowSize } from '../../hooks/use-window-size.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'

export const NoProject = ({
  height,
  width
}) => {
  let recent = useArgs('recent')

  useWindowSize(width * (recent.length ? 2 : 1), height)

  return (
    <div className="no-project">
      <RecentProjects files={recent}/>
      <NewProject/>
    </div>
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
