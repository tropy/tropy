'use strict'

const { createSelector: memo } = require('reselect')
const { entries, values } = Object
const { by } = require('../collate')
const { compose, filter, into, map } = require('transducers.js')
const { blank, get } = require('../common/util')
const { TYPE, ITEM, PHOTO } = require('../constants')
const { value }  = require('../value')

const strip = (id, vocab) =>
  blank(vocab) ? id.split(/(#|\/)/).pop() : id.slice(vocab.length)

const expand = (res, vocab) => ({
  ...res,
  name: strip(res.id, res.vocabulary),
  prefix: get(vocab, [res.vocabulary, 'prefix'])
})

const getResourceList =
  (res, vocab) =>
    into([], map(kv => expand(kv[1], vocab)), res)
      .sort(by('prefix', 'label', 'name'))


const getPropertyList = memo(
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.vocab,
  getResourceList
)

const getDatatypeList = memo(
  ({ ontology }) => ontology.type,
  ({ ontology }) => ontology.vocab,
  getResourceList
)

const getVocabs = memo(
  ({ ontology }) => ontology.vocab,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.class,
  ({ ontology }) => ontology.type,
  (vocab, props, klass, types) => into(
    [],
    map(kv => ({
      ...kv[1],
      classes: kv[1].classes.map(id => klass[id] || { id }),
      datatypes: kv[1].datatypes.map(id => types[id] || { id }),
      properties: kv[1].properties.map(id => props[id] || { id })
    })),
    vocab
  )
)

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
  ({ ontology }) => ontology.template,
  (templates) => into(
    [],
    compose(
      map(kv => kv[1]),
      filter(t => t.type === type)),
    templates
  ).sort(by('name', 'id'))
)

const getTemplateList = memo(
  ({ ontology }) => ontology.template,
  (templates) => values(templates).sort(by('name', 'id'))
)

const getTemplateFields = ({ ontology }, props) =>
  get(ontology.template, [props.id, 'fields'], [])

const getTemplateField = memo(
  getTemplateFields,
  (_, props) => props.field,
  (fields, id) => {
    const idx = fields.findIndex(f => f.id === id)
    return { idx, field: fields[idx] }
  }
)

const getItemTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ settings }) => settings.template,
  (template, id) => template[id] || template[ITEM.TEMPLATE]
)

const getPhotoTemplate = memo(
  ({ ontology }) => ontology.template,
  (template) => template[PHOTO.TEMPLATE]
)

const getTemplateValues = (template) =>
  template.fields.reduce((acc, field) => {
    if (!blank(field.value)) {
      acc[field.property] = value(field.value, field.datatype)
    }

    return acc
  }, {})

const getActiveItemTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ nav }) => nav.items[0],
  ({ items }) => items,
  (template, id, items) =>
    (id != null && id in items) ? template[items[id].template] : null
)

const getActivePhotoTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ nav }) => nav.photo,
  ({ photos }) => photos,
  (template, id, photos) =>
    (id != null && id in photos) ? template[photos[id].template] : null
)

const getActiveSelectionTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ nav }) => nav.selection,
  ({ selections }) => selections,
  (template, id, selections) =>
    (id != null && id in selections) ? template[selections[id].template] : null
)

module.exports = {
  expand,
  getActiveItemTemplate,
  getActivePhotoTemplate,
  getActiveSelectionTemplate,
  getAllTemplates,
  getDatatypeList,
  getItemTemplates: getTemplatesByType(TYPE.ITEM),
  getItemTemplate,
  getPhotoTemplates: getTemplatesByType(TYPE.PHOTO),
  getPhotoTemplate,
  getPropertyList,
  getTemplateField,
  getTemplateFields,
  getTemplateList,
  getTemplateValues,
  getVocabs
}
