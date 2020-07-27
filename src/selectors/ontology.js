'use strict'

const { createSelector: memo } = require('reselect')
const { entries, values } = Object
const { by } = require('../collate')
const { cat, compose, filter, into, map } = require('transducers.js')
const { blank, get, homogenize } = require('../common/util')
const { TROPY, ITEM, PHOTO, SELECTION } = require('../constants')
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

const getClassList = memo(
  ({ ontology }) => ontology.class,
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

const getItemTemplates = getTemplatesByType(TROPY.Item)
const getPhotoTemplates = getTemplatesByType(TROPY.Photo)
const getSelectionTemplates = getTemplatesByType(TROPY.Selection)

const getAllTemplatesByType = memo(
  getItemTemplates,
  getPhotoTemplates,
  getSelectionTemplates,
  (item, photo, selection) => ({
    item, photo, selection
  })
)

const getItemTemplateProperties = memo(
  getItemTemplates,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.vocab,
  (templates, props, vocab) =>
    homogenize(isUniq => into(
      [],
      compose(
        map(tmp => tmp.fields),
        cat,
        filter(fld => isUniq(fld.property)),
        map(fld => expand(props[fld.property] || { id: fld.property }, vocab))
      ),
      templates
    )).sort(by('prefix', 'label', 'name'))
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
  ({ settings }) => settings.templates.item,
  (template, id) => template[id] || template[ITEM.TEMPLATE.DEFAULT]
)

const getPhotoTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ settings }) => settings.templates.photo,
  (template, id) => template[id] || template[PHOTO.TEMPLATE.DEFAULT]
)

const getSelectionTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ settings }) => settings.templates.selection,
  (template, id) => template[id] || template[SELECTION.TEMPLATE.DEFAULT]
)

const getTemplateValues = (template) =>
  template.fields.reduce((acc, field) => {
    if (!blank(field.value)) {
      acc[field.property] = value(field.value, field.datatype)
    }
    return acc
  }, {})

const getTemplateProperties = (template) =>
  template.fields.map(field => field.property)

const getTemplateDefaultValues = memo(
  ({ ontology }, { template }) => ontology.template[template],
  (template) => getTemplateValues(template)
)

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
  getAllTemplatesByType,
  getDatatypeList,
  getClassList,
  getItemTemplate,
  getItemTemplateProperties,
  getItemTemplates,
  getPhotoTemplate,
  getPhotoTemplates,
  getPropertyList,
  getSelectionTemplate,
  getSelectionTemplates,
  getTemplateDefaultValues,
  getTemplateField,
  getTemplateFields,
  getTemplateList,
  getTemplateProperties,
  getTemplateValues,
  getVocabs
}
