import { useDispatch, useSelector } from 'react-redux'
import { useExternalDrop } from './use-external-drop.js'
import { useIpcSend } from './use-ipc.js'
import { hasProjectFiles, hasProjectPaths } from '../components/dnd.js'
import { isProjectFile, isTemplateFile } from '../common/project-file.js'
import * as act from '../actions/index.js'
import * as nav from '../slices/nav/index.js'

export function useDropProjectFiles () {
  let dispatch = useDispatch()
  let openProject = useIpcSend(['cmd', 'app:open-project'])

  let project = useSelector(state => state.project)
  let list = useSelector(nav.selectList)
  let isTrash = useSelector(state => nav.selectIsView(state, 'trash'))

  let canImport = project.path != null && !project.isReadOnly && !isTrash

  return useExternalDrop({
    accept: hasProjectFiles,

    canDrop: (data) =>
      hasProjectPaths(data) || (canImport && data.files.length > 0),

    onDrop: ({ files }) => {
      let projects = files.filter(isProjectFile)
      let templates = files.filter(isTemplateFile)

      if (!(projects.length || templates.length)) {
        dispatch(act.item.import({ list, files }))
        return
      }

      if (templates.length) {
        dispatch(act.ontology.template.import({
          files: templates
        }, { prompt: true }))
      }

      for (let path of projects)
        openProject({ path })
    }
  })
}
