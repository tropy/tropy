import React from 'react'
import { func, number } from 'prop-types'
import { useArgs } from '../../hooks/use-args.js'
import { useWindowSize } from '../../hooks/use-window-size.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'

export const NoProject = React.forwardRef(({
  onProjectOpen,
  height,
  width
}, ref) => {
  let recent = useArgs('recent')

  useWindowSize(width * (recent.length ? 2 : 1), height, 150)

  return (
    <div ref={ref} className="no-project">
      <RecentProjects
        files={recent}
        onSelect={onProjectOpen}/>
      <NewProject
        onCreated={onProjectOpen}/>
    </div>
  )
})

NoProject.propTypes = {
  onProjectOpen: func,
  height: number.isRequired,
  width: number.isRequired
}

NoProject.defaultProps = {
  height: 580,
  width: 440
}
