import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { arrayOf, func, string } from 'prop-types'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar } from '../toolbar.js'
import { Button, ToggleButtonGroup } from '../button.js'
import { FormElement, FormGroup } from '../form.js'
import { TYPES } from '../../common/project.js'
import { create } from '../../slices/project-files.js'


export const NewProject = ({
  accept,
  onCreated
}) => {
  let dispatch = useDispatch()

  let [name, setName] = useState('')
  let [type, setType] = useState(accept[0])

  let handleProjectCreate = useEvent((event) => {
    event.preventDefault()

    dispatch(create({ name, type }))
      .then(action => {
        if (action?.payload?.path)
          onCreated?.(action.payload.path)
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
      <figure/>
      <h1><FormattedMessage id="project.new.title"/></h1>
      <form onSubmit={handleProjectCreate}>
        <h2><FormattedMessage id="project.new.name"/></h2>
        <FormElement>
          <input
            autoFocus
            className="form-control input-lg"
            onChange={handleNameChange}
            type="text"
            value={name}/>
        </FormElement>
        <h2><FormattedMessage id="project.new.type.label"/></h2>
        <FormGroup>
          <ToggleButtonGroup
            id="project.new.type"
            name="type"
            size="lg"
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
          size="xl"
          tabIndex="0"
          text="project.new.create"
          type="submit"/>
      </form>
    </div>
  )
}

NewProject.propTypes = {
  accept: arrayOf(string),
  onCreated: func
}

NewProject.defaultProps = {
  accept: TYPES
}
