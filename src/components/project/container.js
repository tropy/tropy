import { useRef } from 'react'
import { useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { useIpcSend } from '../../hooks/use-ipc.js'
import { Project } from './project.js'
import { NoProject } from './none.js'
import { Fade, SwitchTransition } from '../fx.js'
import { useDropProjectFiles } from '../../hooks/use-drop-project-files.js'


export const ProjectContainer = ({
  isWindowResizeAnimated,
  timeout = 300
}) => {
  let project = useSelector(state => state.project)
  let openProject = useIpcSend(['cmd', 'app:open-project'])

  let handleProjectOpen = useEvent((path, meta) => {
    openProject({ path, ...meta })
  })

  let [{ isOver }, drop] = useDropProjectFiles()

  let nodeRef = useRef(null)
  let ref = (node) => {
    nodeRef.current = node
    drop(node)
  }

  return (
    <SwitchTransition>
      <Fade
        key={project.path ? 'project' : 'no-project'}
        nodeRef={nodeRef}
        enter={isWindowResizeAnimated}
        exit={false}
        timeout={timeout}>
        {project.path ? (
          <Project
            ref={ref}
            isOver={isOver}
            project={project}/>
        ) : (
          <NoProject
            ref={ref}
            isOver={isOver}
            onProjectOpen={handleProjectOpen}/>
        )}
      </Fade>
    </SwitchTransition>
  )
}
