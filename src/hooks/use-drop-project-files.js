import { useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { hasProjectFiles } from '../components/dnd.js'
import { getProjectType } from '../common/project.js'

function isProjectFile(path) {
  try {
    return getProjectType(path) != null
  } catch {
    return false
  }
}

export function useDropProjectFiles({ onDrop }) {
  return useDrop(() => ({
    accept: [NativeTypes.FILE],

    drop(item) {
      let projects = []
      let templates = []

      for (let file of item.files) {
        if (isProjectFile(file.path))
          projects.push(file.path)
        else if (file.path.endsWith('.ttp'))
          templates.push(file.path)
      }

      if (projects.length || templates.length) {
        onDrop({ projects, templates })
        return { projects, templates }
      }
    },

    canDrop: (item) => hasProjectFiles(item),

    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop()
    })
  }), [onDrop])
}
