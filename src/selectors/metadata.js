import { createSelector as memo } from 'reselect'
import { pluck } from './util'
import { array, own } from '../common/util'
import { equal } from '../value'
import { compare } from '../collate'
import { TYPE } from '../constants'

import {
  cat,
  compose,
  filter,
  keep,
  map,
  seq,
  transduce,
  transformer
} from 'transducers.js'

import {
  getActiveItemTemplate,
  getActiveSelectionTemplate
} from './ontology'

import {
  getActivePhotoTemplate,
  getSelectedPhotoIds
} from './photos'

const EMPTY = []

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

const getMetadataValues = (metadata, ids) =>
  seq(
    transduce(
      ids,
      compose(map(id => metadata[id]), keep(), cat, skipId),
      collect,
      { id: ids }),
    map(([key, value]) => {
      if (key !== 'id') {
        value.mixed = value.count !== ids.length
      }

      return [key, value]
    }))

export const getItemMetadata = memo(
  getMetadata,
  ({ nav }) => (nav.items),
  getMetadataValues
)

export const getVisibleMetadata = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

const getProperty = (id, props, compact) =>
  (!(id in props)) ?
    { id } : (!compact) ?
      props[id] : { id, label: props[id].label }

export const getMetadataFields = memo(
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

      fld.id = array(data.id)
    }

    fld.idx = idx

    return fld
  }
)

export const getItemFields = memo(
  getActiveItemTemplate,
  getItemMetadata,
  ({ ontology }) => ontology.props,
  (template, data, props) =>
    getMetadataFields(null, { template, data, props })
)

const getPhotoMetadata = memo(
  getMetadata,
  getSelectedPhotoIds,
  getMetadataValues
)

const getSelectionMetadata = memo(
  getMetadata,
  ({ nav }) => nav.selection,
  (metadata, id) => metadata[id] || { id }
)

export const getPhotoFields = memo(
  getActivePhotoTemplate,
  getPhotoMetadata,
  ({ ontology }) => ontology.props,
  (template, data, props) =>
    getMetadataFields(null, { template, data, props })
)

export const getSelectionFields = memo(
  getActiveSelectionTemplate,
  getSelectionMetadata,
  ({ ontology }) => ontology.props,
  (template, data, props) =>
    getMetadataFields(null, { template, data, props })
)

const getActiveProperty =
  ({ edit }) => edit?.field?.property

const getActiveId =
  ({ edit }) => edit?.field?.id?.[0]

const getActiveDatatype = memo(
  getMetadata, getActiveProperty, getActiveId,
  (metadata, prop, id) =>
    metadata?.[id]?.[prop]?.type || TYPE.TEXT
)

const makeCompletionFilter = (prop, datatype, byProp) =>
  byProp ?
    ([id, v]) => id === prop && v && !!(v.text) && v.type === datatype :
    ([id, v]) => id !== 'id' && v && !!(v.text) && v.type === datatype

export const getMetadataCompletions = memo(
  getMetadata,
  getActiveProperty,
  getActiveDatatype,
  ({ settings }) => settings.completions === 'property-datatype',

  (metadata, prop, datatype, byProp) => {
    if (prop == null) return EMPTY
    let comp = new Set()

    seq(metadata, compose(
      map(([, data]) => data),
      cat,
      filter(makeCompletionFilter(prop, datatype, byProp)),
      map(([, value]) => comp.add(value.text))))

    return [...comp].sort(compare)
  }
)
