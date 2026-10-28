import { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useDropProjectFiles } from '../../hooks/use-drop-project-files.js'
import { useEvent } from '../../hooks/use-event.js'
import { useIpcSend } from '../../hooks/use-ipc.js'
import { Project } from './project.js'
import { NoProject } from './none.js'
import { Fade, SwitchTransition } from '../fx.js'
import * as act from '../../actions/index.js'


export const ProjectContainer = ({
  isWindowResizeAnimated,
  timeout = 300
}) => {
  let dispatch = useDispatch()

  let project = useSelector(state => state.project)
  let openProject = useIpcSend(['cmd', 'app:open-project'])

  let handleProjectOpen = useEvent((path, meta) => {
    openProject({ path, ...meta })
  })

  let onDrop = useEvent(({ projects, templates }) => {
    if (templates.length) {
      dispatch(act.ontology.template.import({
        files: templates
      }, { prompt: true }))
    }

    for (let path of projects)
      handleProjectOpen(path)
  })

  let [{ isOver }, drop] = useDropProjectFiles({ onDrop })
  let nodeRef = useRef(null)

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
            ref={drop(nodeRef)}
            project={project}
            isOver={isOver}/>
        ) : (
          <NoProject
            ref={drop}
            isOver={isOver}
            onProjectOpen={handleProjectOpen}/>
        )}
      </Fade>
    </SwitchTransition>
  )
}
