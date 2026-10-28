import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar } from '../toolbar.js'
import { Button, ToggleButtonGroup } from '../button.js'
import { Form, FormGroup } from '../form.js'
import { TYPES } from '../../common/project.js'
import { save } from '../../dialog.js'


export const NewProject = ({
  accept = TYPES,
  onCreate
}) => {
  let [name, setName] = useState('')
  let [type, setType] = useState(accept[0])

  let handleProjectCreate = useEvent(async (event) => {
    event.preventDefault()

    let path = await save.project(type, name)
    if (path)
      onCreate?.(path, {
        name,
        overwrite: true
      })
  })

  let handleNameChange = useEvent(e => {
    setName(e.target.value)
  })

  let handleTypeChange = useEvent(v => {
    setType(v.type)
  })

  return (
    <div className="new-project">
      <Titlebar isOptional/>
      <figure className="tropy-icon"/>
      <h1><FormattedMessage id="project.new.title"/></h1>
      <Form onSubmit={handleProjectCreate}>
        <h2><FormattedMessage id="project.new.name"/></h2>
        <FormGroup>
          <input
            autoFocus
            className="form-control form-control-xl"
            onChange={handleNameChange}
            type="text"
            value={name}/>
        </FormGroup>
        <h2><FormattedMessage id="project.new.type.label"/></h2>
        <FormGroup>
          <ToggleButtonGroup
            id="project.new.type"
            name="type"
            size="xl"
            options={accept}
            onChange={handleTypeChange}
            value={type}/>
          <p className="form-text">
            <FormattedMessage id={`project.new.type.hint.${type}`}/>
          </p>
        </FormGroup>
        <Button
          isBlock
          isDisabled={!name}
          isPrimary
          size="xxl"
          tabIndex="0"
          text="project.new.create"
          type="submit"/>
      </Form>
    </div>
  )
}
