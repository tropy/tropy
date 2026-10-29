import React from 'react'
import {
  Form, FormElement, FormField, FormSlider, FormToggle, FormToggleGroup
} from '../form.js'
import { Button } from '../button.js'
import { ProjectTypeField } from './type-field.js'
import { notify } from '../../dialog.js'
import { BASES, TYPES } from '../../common/project.js'
import { protocolURL } from '../../common/util.js'
import { convert, optimize } from '../../slices/project-files.js'
import { useDispatch } from 'react-redux'
import { useIntl } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { useIpcSend } from '../../hooks/use-ipc.js'
import { useWindow } from '../../hooks/use-window.js'


const busy = async (win, action) => {
  try {
    win.toggle('busy', true)
    return await action()
  } finally {
    win.toggle('busy', false)
  }
}

export const ProjectSettings = React.memo(({
  baseOptions = BASES,
  project,
  onChange
}) => {
  let dispatch = useDispatch()
  let intl = useIntl()
  let win = useWindow()
  let switchProject = useIpcSend(['cmd', 'app:switch-project'])

  let handleProjectOptimize = useEvent(() => busy(win, async () => {
    let action = await dispatch(optimize({
      name: project.name,
      src: project.path,
      quality: project.optimize?.quality
    }))

    if (action?.payload?.path) {
      await notify('project.optimize')
      switchProject({ path: action.payload.path, old: project.path })
    }
  }))

  let handleProjectConvert = useEvent(() => busy(win, async () => {
    let action = await dispatch(convert({
      name: project.name,
      src: project.path,
      type: TYPES[0]
    }))

    if (action?.payload?.path) {
      await notify('project.convert', {
        detail: intl.formatMessage({ id: 'prefs.project.convert.detail' }, {
          errors: action.payload.errors.length
        })
      })

      switchProject({ path: action.payload.path, old: project.path })
    }
  }))

  return (
    <Form size={8}>
      <FormField
        id="prefs.project.name"
        name="name"
        isCompact
        isReadOnly={project.isReadOnly}
        isRequired
        tabIndex={0}
        value={project.name}
        onChange={onChange}/>
      <FormField
        id="prefs.project.id"
        name="id"
        isCompact
        isReadOnly
        value={project.id}/>
      <FormField
        id="prefs.project.url"
        name="url"
        isCompact
        isReadOnly
        value={protocolURL(project.path)}/>
      <FormField
        id="prefs.project.path"
        name="path"
        isCompact
        isReadOnly
        value={project.path}/>
      <ProjectTypeField
        isDisabled={project.isManaged}
        value={TYPES[project.isManaged ? 0 : 1]}
        onConvert={handleProjectConvert}/>
      {project.isManaged && (
        <>
          <hr/>
          <FormSlider
            id="prefs.project.optimize.quality"
            name="optimize.quality"
            isCompact
            value={project.optimize.quality}
            onChange={onChange}/>
          <FormToggle
            id="prefs.project.optimize.onImport"
            name="optimize.onImport"
            value={project.optimize.onImport}
            onChange={onChange}/>
          <FormElement isCompact>
            <Button
              className="btn-default"
              text="prefs.project.optimize.confirm"
              tabIndex={0}
              isDisabled={project.isReadOnly}
              onClick={handleProjectOptimize}/>
          </FormElement>
        </>
      )}
      <hr/>

      {!project.isManaged && (
        <>
          <FormToggleGroup
            id="prefs.project.base"
            name="base"
            isReadOnly={project.isReadOnly}
            default="none"
            value={project.base}
            options={baseOptions}
            tabIndex={0}
            onChange={onChange}/>
          <hr/>
        </>
      )}

      <FormField
        id="prefs.project.watch.folder"
        name="watch.folder"
        isCompact
        tabIndex={0}
        type="directory"
        value={project.watch.folder}
        onChange={onChange}/>
      <FormToggle
        id="prefs.project.watch.usePolling"
        isDisabled={!project.watch.folder}
        name="watch.usePolling"
        value={!!project.watch.usePolling}
        onChange={onChange}/>
    </Form>
  )
})
