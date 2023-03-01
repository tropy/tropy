import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { bool, func, string } from 'prop-types'
import { FormField } from '../form.js'
import { Button } from '../button.js'

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
      <FormField
        id="prefs.project.type"
        name="type"
        isCompact
        isReadOnly
        value={type}/>
      <Button
        text="Edit"
        onClick={() => setEditing(!isEditing)}/>
      {isEditing &&
        <>
          <Button
            text="prefs.project.convert.confirm"
            onClick={onConvert}/>

        </>
      }
    </>
  )
}

ProjectTypeField.propTypes = {
  isDisabled: bool,
  onConvert: func,
  value: string.isRequired
}
