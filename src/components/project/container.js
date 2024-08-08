import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useDropProjectFiles } from '../../hooks/use-drop-project-files.js'
import { useEvent } from '../../hooks/use-event.js'
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

  let handleProjectOpen = useEvent(path => {
    if (path !== project.path)
      dispatch(act.project.open(path))
  })

  let onDrop = useEvent(({ projects, templates }) => {
    if (templates.length) {
      dispatch(act.ontology.template.import({
        files: templates
      }, { prompt: true }))
    }

    if (projects.length) {
      // Subtle: currently handling only the first project file!
      handleProjectOpen(projects[0])
    }
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
