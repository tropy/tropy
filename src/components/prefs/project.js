import React from 'react'
import { arrayOf, func, object, string } from 'prop-types'
import { ScrollContainer } from '../scroll/container.js'
import { Form, FormField, FormToggle, FormToggleGroup } from '../form.js'
import { ProjectTypeField } from './project-type-field.js'
import { notify } from '../../dialog.js'
import { BASES, TYPES } from '../../common/project.js'
import { convert } from '../../slices/project-files.js'
import { useDispatch } from 'react-redux'
import { useIntl } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { useWindow } from '../../hooks/use-window.js'


export const ProjectPrefs = React.memo(({
  baseOptions,
  project,
  onChange
}) => {
  let dispatch = useDispatch()
  let intl = useIntl()
  let win = useWindow()

  let handleProjectConvert = useEvent(async () => {
    try {
      win.toggle('busy', true)

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

        // close prefs/project and open new project
      }
    } finally {
      win.toggle('busy', false)
    }
  })

  return (
    <ScrollContainer>
      <Form>
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
          id="prefs.project.path"
          name="path"
          isCompact
          isReadOnly
          value={project.path}/>
        <ProjectTypeField
          isDisabled={project.isManaged}
          value={TYPES[project.isManaged ? 0 : 1]}
          onConvert={handleProjectConvert}/>
        <hr/>

        {!project.isManaged &&
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
          </>}

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
    </ScrollContainer>
  )
})

ProjectPrefs.propTypes = {
  project: object.isRequired,
  baseOptions: arrayOf(string).isRequired,
  onChange: func.isRequired
}

ProjectPrefs.defaultProps = {
  baseOptions: BASES
}
