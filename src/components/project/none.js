import React from 'react'
import cx from 'classnames'
import { useArgs } from '../../hooks/use-args.js'
import { useWindowSize } from '../../hooks/use-window-size.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'

export const NoProject = React.forwardRef(({
  isOver,
  onProjectOpen,
  height = 580,
  width = 440
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
