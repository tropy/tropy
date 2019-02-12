'use strict'

const React = require('react')
const { TemplateField } = require('./field')
const { arrayOf, number, shape, string } = require('prop-types')

const TemplateFieldList = ({ fields, template, ...props }) => {
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
  template: string.isRequired,
}

module.exports = {
  TemplateFieldList
}
