import { createSelector as memo } from 'reselect'
import { by } from '../collate'
import { cat, compose, filter, into, map } from 'transducers.js'
import { blank, get, homogenize } from '../common/util'
import { expand, tropy } from '../ontology'
import { ITEM, PHOTO, SELECTION } from '../constants'
import { value }  from '../value'
import { getSelectedPhoto } from './photos'

const getResourceList =
  (res, vocab) =>
    into([], map(kv => expand(kv[1], vocab)), res)
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
  (templates) => into(
    [],
    compose(
      map(kv => kv[1]),
      filter(t => t.type === type)),
    templates
  ).sort(by('name', 'id'))
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
  ({ nav }) => nav.items[0],
  ({ items }) => items,
  (template, id, items) =>
    (id != null && id in items) ? template[items[id].template] : null
)

export const getActivePhotoTemplate = memo(
  ({ ontology }) => ontology.template,
  getSelectedPhoto,
  (template, photo) => template[photo?.template]
)

export const getActiveSelectionTemplate = memo(
  ({ ontology }) => ontology.template,
  ({ nav }) => nav.selection,
  ({ selections }) => selections,
  (template, id, selections) =>
    (id != null && id in selections) ? template[selections[id].template] : null
)
