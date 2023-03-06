import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { bool, func, string } from 'prop-types'
import { FormField, FormElement } from '../form.js'
import { Button } from '../button.js'
import { Input } from '../input.js'
import { IconPencil } from '../icons'
import cx from 'classnames'


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
    <FormElement
      id="prefs.project.type"
      className={cx({ editing: isEditing })}
      htmlFor="prefs.projefct.type"
      isCompact>
      <div className="flex-row">
        <Input
          id="prefs.project.type"
          className="form-control"
          value={type}
          isReadOnly/>
        <Button
          className="btn-edit"
          icon={<IconPencil/>}
          onClick={() => setEditing(!isEditing)}/>
        <Button
          className="btn-default btn-block btn-convert"
          text="prefs.project.convert.confirm"
          tabIndex={0}
          onClick={onConvert}
          isDisabled={!isEditing}/>
      </div>
      <p className="form-description">
        Links to photos at their original location.
      </p>
      <p className="form-description">
        Convert this project into a Standard project.
      </p>
    </FormElement>
  )
}

ProjectTypeField.propTypes = {
  isDisabled: bool,
  onConvert: func,
  value: string.isRequired
}
