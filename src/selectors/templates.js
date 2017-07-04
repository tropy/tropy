'use strict'

const { createSelector: memo } = require('reselect')
const { into, compose, map, filter } = require('transducers.js')
const { entries, values } = Object
const { get } = require('../common/util')

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

const getTemplateFields = ({ ontology }, props) =>
  get(ontology.template, [props.id, 'fields'], [])

const getTemplateField = memo(
  getTemplateFields,
  (_, props) => props.field,
  (fields, id) => {
    const idx = fields.find(f => f.id === id)
    return { idx, field: fields[idx] }
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
