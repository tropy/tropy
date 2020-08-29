import React from 'react'
import { TemplateField } from './field'
import { arrayOf, number, shape, string } from 'prop-types'

export const TemplateFieldList = ({ fields, template, ...props }) => {
  if (template == null) return
  let isSingle = fields.length === 1

  return (
    <ul className="template-field-list">
      {fields.map((field, idx) =>
        <TemplateField
          {...props}
          key={field.id}
          field={field}
          position={idx}
          isSingle={isSingle}
          isTransient={field.id < 0}/>)}
    </ul>
  )
}

TemplateFieldList.propTypes = {
  fields: arrayOf(shape({
    id: number.isRequired
  })).isRequired,
  template: string.isRequired
}
