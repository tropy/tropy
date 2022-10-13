import React from 'react'
import { arrayOf, func, object, string } from 'prop-types'
import { ScrollContainer } from '../scroll/container.js'
import { Form, FormField, FormToggle, FormToggleGroup } from '../form.js'
import { BASES } from '../../common/project.js'

export const ProjectPrefs = React.memo(({
  baseOptions,
  project,
  onChange
}) => {
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
          isRequired
          value={project.id}/>
        <FormField
          id="prefs.project.path"
          name="path"
          isCompact
          isReadOnly
          isRequired
          value={project.path}/>
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
