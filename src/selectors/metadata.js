'use strict'

const { createSelector: memo } = require('reselect')
const { pluck } = require('./util')
const { get, own } = require('../common/util')
const { equal } = require('../value')
const { compare } = require('../collate')
const {
  cat, compose, filter, keep, map, seq, transduce, transformer
} = require('transducers.js')

const { TYPE } = require('../constants')

const {
  getActiveItemTemplate,
  getActivePhotoTemplate,
  getActiveSelectionTemplate
} = require('./ontology')


const collect = transformer((data, [key, value]) => {
  if (value != null) {
    if (own(data, key)) {
      if (equal(data[key], value)) data[key].count++

    } else {
      data[key] = { ...value, count: 1 }
    }
  }

  return data
})

const skipId = filter(kv => kv[0] !== 'id')

const getMetadata = ({ metadata }) => metadata

const getItemMetadata = memo(
  getMetadata,
  ({ nav }) => (nav.items),

  (metadata, items) =>
    seq(
      transduce(
        items,
        compose(map(id => metadata[id]), keep(), cat, skipId),
        collect,
        { id: items.length > 1 ? items : items[0] }),
      map(([key, value]) => {
        if (key !== 'id') {
          value.mixed = value.count !== items.length
        }

        return [key, value]
      }))
)

const getVisibleMetadata = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

const getProperty = (id, props, compact) =>
  (!(id in props)) ?
    { id } : (!compact) ?
      props[id] : { id, label: props[id].label }

const getMetadataFields = memo(
  (_, { data }) => data,
  (_, { template }) => template,
  (_, { props }) => props,
  (_, { compact }) => compact,
  (data, template, props, compact) => {
    let fld = []
    let idx = {}

    if (template != null) {
      for (let f of template.fields) {
        if (compact && (data == null || !(f.property in data))) {
          continue
        }

        idx[f.property] = fld.length

        fld.push({
          isExtra: false,
          isRequired: f.isRequired,
          isReadOnly: f.isConstant,
          label: f.label,
          placeholder: f.hint,
          property: getProperty(f.property, props, compact),
          type: f.datatype,
          value: data != null && data[f.property] || {}
        })
      }
    }

    let ext = fld.length

    if (data != null) {
      for (let id in data) {
        if (id === 'id' || idx[id] != null) continue
        idx[id] = fld.length
        fld.push({
          isExtra: true,
          property: props[id] || { id },
          value: data[id]
        })
      }

      fld.id = data.id
    }

    fld.key = Array.isArray(fld.id) ? 'bulk' : fld.id
    fld.idx = idx
    fld.ext = ext

    return fld
  }
)

const getItemFields = memo(
  getActiveItemTemplate,
  getItemMetadata,
  ({ ontology }) => ontology.props,
  (template, data, props) =>
    getMetadataFields(null, { template, data, props })
)

const getPhotoMetadata = memo(
  getMetadata,
  ({ nav }) => nav.photo,
  (metadata, id) => metadata[id] || { id }
)

const getSelectionMetadata = memo(
  getMetadata,
  ({ nav }) => nav.selection,
  (metadata, id) => metadata[id] || { id }
)

const getPhotoFields = memo(
  getActivePhotoTemplate,
  getPhotoMetadata,
  ({ ontology }) => ontology.props,
  (template, data, props) =>
    getMetadataFields(null, { template, data, props })
)

const getSelectionFields = memo(
  getActiveSelectionTemplate,
  getSelectionMetadata,
  ({ ontology }) => ontology.props,
  (template, data, props) =>
    getMetadataFields(null, { template, data, props })
)

const any = (src) => { for (let key in src) return key }

const getActiveProperty =
  ({ edit }) => ('field' in edit) ? any(edit.field) : null

const getActiveId =
  ({ edit }) => ('field' in edit) ? edit.field[any(edit.field)] : null

const getActiveDatatype = memo(
  getMetadata, getActiveProperty, getActiveId,
  (metadata, prop, id) =>
    get(metadata, [id, prop, 'type'], TYPE.TEXT)
)

const makeCompletionFilter = (prop, datatype, perField = false) =>
  perField ?
    ([id, v]) => id === prop && v && !!(v.text) && v.type === datatype :
    ([id, v]) => id !== 'id' && v && !!(v.text) && v.type === datatype

const getMetadataCompletions = memo(
  getMetadata, getActiveProperty, getActiveDatatype,
  (metadata, prop, datatype) => {
    if (prop == null) return []
    let comp = new Set()

    seq(metadata, compose(
      map(([, data]) => data),
      cat,
      filter(makeCompletionFilter(prop, datatype)),
      map(([, value]) => comp.add(value.text))))

    return [...comp].sort(compare)
  }
)

module.exports = {
  getItemMetadata,
  getItemFields,
  getPhotoFields,
  getSelectionFields,
  getMetadataFields,
  getMetadataCompletions,
  getVisibleMetadata
}
