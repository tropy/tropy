import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar } from '../toolbar.js'
import { Button, ToggleButtonGroup } from '../button.js'
import { arrayOf, string } from 'prop-types'
import { FormElement, FormGroup } from '../form.js'
import { TPY, TPM } from '../../common/project.js'



export const NewProject = ({
  accept
}) => {
  let dispatch = useDispatch()

  let [name, setName] = useState('')
  let [type, setType] = useState(accept[0])

  let handleProjectCreate = useEvent(() => {
    dispatch({
      type: 'project/create/not/implemented/yet',
      payload: { name, type }
    })

  })

  return (
    <div className="new-project">
      <Titlebar isOptional/>
      <figure/>
      <h1><FormattedMessage id="project.new.title"/></h1>
      <form>
        <h2><FormattedMessage id="project.new.name"/></h2>
        <FormElement>
          <input
            autoFocus
            className="form-control input-lg"
            onChange={useEvent(e => setName(e.target.value))}
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
            onChange={useEvent(v => setType(v.type))}
            value={type}/>
          <p className="form-text">
            <FormattedMessage id={`project.new.type.hint.${type}`}/>
          </p>
        </FormGroup>
        <Button
          isBlock
          isDisabled={!name}
          isPrimary
          onClick={handleProjectCreate}
          size="xl"
          text="Create Project"/>
      </form>
    </div>
  )
}

NewProject.propTypes = {
  accept: arrayOf(string)
}

NewProject.defaultProps = {
  accept: [TPM, TPY]
}
