import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { bool, func, string } from 'prop-types'
import { FormField, FormElement } from '../form.js'
import { Button } from '../button.js'
import { Input } from '../input.js'


export const ProjectTypeField = ({
  isDisabled,
  value,
  onConvert
}) => {
  let intl = useIntl()
  let [isEditing, setEditing] = useState(false)

  let type = intl.formatMessage({
    id: `project.new.type.option.${value}`
  })

  if (isDisabled)
    return (
      <FormField
        id="prefs.project.type"
        name="type"
        isCompact
        isReadOnly
        value={type}/>
    )

  return (
      <>
        <FormElement
          id={"prefs.project.type"}
          htmlFor="prefs.projefct.type"
          size={8}
          isCompact>
          <div className="flex-row">
            <Input
              id={"prefs.project.type"}
              className="form-control"
              value={type}
              isReadOnly/>
            <Button
              text="Edit"
              onClick={() => setEditing(!isEditing)}/>
          </div>
        </FormElement>
        {isEditing &&
          <FormElement>
            <Button
              text="prefs.project.convert.confirm"
              onClick={onConvert}/>
          </FormElement>
        }
      </>
  )
}

ProjectTypeField.propTypes = {
  isDisabled: bool,
  onConvert: func,
  value: string.isRequired
}
