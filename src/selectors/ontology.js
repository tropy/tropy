import { createSelector as memo } from '@reduxjs/toolkit'
import { by } from '../collate.js'
import { blank, get, homogenize } from '../common/util.js'
import { expand, tropy } from '../ontology/index.js'
import { ITEM, PHOTO, SELECTION } from '../constants/index.js'
import { value } from '../value.js'
import { getPrimaryItemId } from './items.js'

const getResourceList =
  (res, vocab) =>
    Object.values(res)
      .map(r => expand(r, vocab))
      .sort(by('prefix', 'label', 'name'))


export const getPropertyList = memo(
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.vocab,
  getResourceList
)

export const getDatatypeList = memo(
  ({ ontology }) => ontology.type,
  ({ ontology }) => ontology.vocab,
  getResourceList
)

export const getVocabs = memo(
  ({ ontology }) => ontology.vocab,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.class,
  ({ ontology }) => ontology.type,
  (vocab, props, klass, types) =>
    Object.values(vocab).map(v => ({
      ...v,
      classes: v.classes.map(id => klass[id] || { id }),
      datatypes: v.datatypes.map(id => types[id] || { id }),
      properties: v.properties.map(id => props[id] || { id })
    }))
)

export const getAllTemplates = memo(
  ({ ontology }) => ontology.template,
  ({ ontology }) => ontology.props,

  (templates, props) =>
    Object.entries(templates)
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
  (templates) => Object.values(templates)
    .filter(t => t.type === type)
    .sort(by('name', 'id'))
)

export const getItemTemplates = getTemplatesByType(tropy.Item)
export const getPhotoTemplates = getTemplatesByType(tropy.Photo)
export const getSelectionTemplates = getTemplatesByType(tropy.Selection)

export const getAllTemplatesByType = memo(
  getItemTemplates,
  getPhotoTemplates,
  getSelectionTemplates,
  (item, photo, selection) => ({
    item, photo, selection
  })
)

export const getItemTemplateProperties = memo(
  getItemTemplates,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.vocab,
  (templates, props, vocab) =>
    homogenize(isUniq => templates
      .flatMap(tmp => tmp.fields)
      .filter(fld => isUniq(fld.property))
      .map(fld => expand(props[fld.property] || { id: fld.property }, vocab))
    ).sort(by('prefix', 'label', 'name'))
)

export const selectTemplatesByType = memo(
  (state) => state.ontology.template,
  (_, props) => props.type,
  (templates, type) =>
    Object.values(templates)
      .filter(t => type == null || t.type === type)
      .sort(by('name', 'id')))

export const getTemplateList = memo(
  ({ ontology }) => ontology.template,
  (templates) => Object.values(templates).sort(by('name', 'id'))
)

export const getTemplateFields = ({ ontology }, props) =>
  get(ontology.template, [props.id, 'fields'], [])

export const getTemplateField = memo(
  getTemplateFields,
  (_, props) => props.field,
  (fields, id) => {
    const idx = fields.findIndex(f => f.id === id)
    return { idx, field: fields[idx] }
  }
)

export const getItemTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ settings }) => settings.templates.item,
  (template, id) => template[id] || template[ITEM.TEMPLATE.DEFAULT]
)

export const getPhotoTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ settings }) => settings.templates.photo,
  (template, id) => template[id] || template[PHOTO.TEMPLATE.DEFAULT]
)

export const getSelectionTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ settings }) => settings.templates.selection,
  (template, id) => template[id] || template[SELECTION.TEMPLATE.DEFAULT]
)

export const getTemplateValues = (template) =>
  template.fields.reduce((acc, field) => {
    if (!blank(field.value)) {
      acc[field.property] = value(field.value, field.datatype)
    }
    return acc
  }, {})

export const getTemplateProperties = (template) =>
  template.fields.map(field => field.property)

export const getTemplateDefaultValues = memo(
  ({ ontology }, { template }) => ontology.template[template],
  (template) => getTemplateValues(template)
)

export const getActiveItemTemplate = memo(
  ({ ontology }) => ontology.template,
  getPrimaryItemId,
  ({ items }) => items,
  (template, id, items) =>
    (id != null && id in items) ? template[items[id].template] : null
)

export const getActivePhotoTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ nav }) => nav.selection.photo,
  ({ photos }) => photos,
  (template, id, photos) =>
    (id != null && id in photos) ? template[photos[id].template] : null
)

export const getActiveSelectionTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ nav }) => nav.selection.selection,
  ({ selections }) => selections,
  (template, id, selections) =>
    (id != null && id in selections) ? template[selections[id].template] : null
)
