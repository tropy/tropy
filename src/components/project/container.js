import { extname } from 'node:path'
import React from 'react'
import { bool } from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Project } from './project.js'
import { NoProject } from './none.js'
import { Fade, SwitchTransition } from '../fx.js'
import { DND, useDrop, hasProjectFiles } from '../dnd.js'
import * as act from '../../actions/index.js'


export const ProjectContainer = ({
  isWindowResizeAnimated,
  timeout
}) => {
  let dispatch = useDispatch()

  let project = useSelector(state => state.project)

  let handleProjectOpen = useEvent(path => {
    dispatch(act.project.open(path))
  })

  let handleTemplateImport = useEvent(files => {
    dispatch(act.ontology.template.import({ files }, { prompt: true }))
  })

  let [{ isOver }, drop] = useDrop(() => ({
    accept: [DND.FILE],

    drop(item) {
      let projects = []
      let templates = []

      for (let file of item.files) {
        switch (extname(file.path).toLowerCase()) {
          case '.tpy':
            // TODO move this to handleProjectOpen
            if (file.path !== project.path)
              projects.push(file.path)
            break
          case '.ttp':
            templates.push(file.path)
            break
        }
      }

      // Subtle: currently handling only the first project file!
      if (projects.length) {
        handleProjectOpen(projects[0])
        return { files: projects }
      }

      if (templates.length) {
        handleTemplateImport(templates)
        return { files: templates }
      }
    },

    // FIXME in recent Electron versions we can't see the mime-types anymore on drag
    // so this is currently broken.
    canDrop: (item) =>
      true || hasProjectFiles(item),

    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop()
    })
  }), [project.path, handleProjectOpen, handleTemplateImport])


  return (
    <SwitchTransition>
      <Fade
        key={project.path ? 'project' : 'no-project'}
        enter={isWindowResizeAnimated}
        exit={false}
        timeout={timeout}>
        {project.path ?
          <Project
            ref={drop}
            project={project}
            isOver={isOver}/> :
          <NoProject
            ref={drop}
            isOver={isOver}
            onProjectOpen={handleProjectOpen}/>}
      </Fade>
    </SwitchTransition>
  )
}

ProjectContainer.propTypes = {
  isWindowResizeAnimated: bool,
  timeout: 300
}
