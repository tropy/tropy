'use strict'

const { createSelector: memo } = require('reselect')
const { into, compose, map, filter } = require('transducers.js')
const { entries, values } = Object

const getAllTemplates = memo(
  ({ ontology }) => ontology.template,
  ({ ontology }) => ontology.props,

  (templates, props) =>
    entries(templates)
      .reduce((tpl, [k, v]) => {
        tpl[k] = {
          ...v,
          fields: v.fields.map(field => ({
            ...field,
            property: props[field.property] || { id: field.property }
          }))
        }

        return tpl

      }, {}))


const getTemplatesByType = (type) => memo(
  getAllTemplates,
  (templates) => into(
    [],
    compose(
      map(kv => kv[1]),
      filter(t => t.type === type)),
    templates
  )
)

const getTemplates = memo(
  getAllTemplates, (templates) => values(templates)
)

const getTemplateField = memo(
  ({ ontology }, props) => ontology.template[props.id],
  (_, props) => props.field,
  (template, field) =>
    template && template.fields.find(f => f.id === field)
)

const getTemplateFields = memo(
  ({ ontology }, props) => ontology.template[props.id],
  (_, props) => props.fields,
  (template, fields) => {
    if (template == null) return []
    if (fields == null) return []
    return template.fields.filter(f => fields.includes(f.id))
  }
)

module.exports = {
  getAllTemplates,
  getItemTemplates: getTemplatesByType('item'),
  getPhotoTemplates: getTemplatesByType('photo'),
  getTemplates,
  getTemplateField,
  getTemplateFields
}
