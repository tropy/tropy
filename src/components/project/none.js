import React from 'react'
import { bool, func, number } from 'prop-types'
import cx from 'classnames'
import { useArgs } from '../../hooks/use-args.js'
import { useWindowSize } from '../../hooks/use-window-size.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'

export const NoProject = React.forwardRef(({
  isOver,
  onProjectOpen,
  height,
  width
}, ref) => {
  let recent = useArgs('recent')

  useWindowSize(width * (recent.length ? 2 : 1), height)

  return (
    <div ref={ref} className={cx('no-project', { over: isOver })}>
      <RecentProjects
        files={recent}
        onSelect={onProjectOpen}/>
      <NewProject
        onCreated={onProjectOpen}/>
    </div>
  )
})

NoProject.propTypes = {
  isOver: bool,
  onProjectOpen: func,
  height: number.isRequired,
  width: number.isRequired
}

NoProject.defaultProps = {
  height: 580,
  width: 440
}
