import { useEffect } from 'react'
import { useArgs } from '../../hooks/use-args.js'
import { useWindow } from '../../hooks/use-window.js'
import { NewProject } from './new.js'
import { RecentProjects } from './recent.js'

export const NoProject = () => {
  let recent = useArgs('recent')
  let win = useWindow()

  useEffect(() => {
    let { width, height } = win
    win.setResizable(false)

    return () => {
      win.resize(width, height, true)
      win.setResizable(true)
    }
  }, [win])

  useEffect(() => {
    if (recent.length)
      win.resize(880, 580, true)
    else
      win.resize(440, 580, true)

  }, [win, recent])

  return (
    <div className="no-project">
      <RecentProjects files={recent.current}/>
      <NewProject/>
    </div>
  )
}
