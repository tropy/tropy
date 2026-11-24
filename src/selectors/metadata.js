import { createSelector as memo } from '@reduxjs/toolkit'
import { pluck } from './util.js'
import { selectItemSequence } from '../slices/qr.js'

import {
  selectItemCursor,
  selectItemSelection,
  selectPhotoCursor,
  selectSelectionCursor
} from '../slices/nav/selectors.js'
import { equal } from '../value.js'
import { compare } from '../collate.js'
import { createSequence, getIndex } from '../common/sequence.js'

import {
  getActiveItemTemplate,
  getActivePhotoTemplate,
  getActiveSelectionTemplate
} from './ontology.js'

const EMPTY = []

const collect = (data, [key, value]) => {
  if (value != null) {
    if (Object.hasOwn(data, key)) {
      if (equal(data[key], value)) data[key].count++

    } else {
      data[key] = { ...value, count: 1 }
    }
  }

  return data
}

// The first id's values represent mixed fields.
const collectMetadata = (metadata, ids, first = ids[0]) => {
  let data = [first, ...ids.filter(id => id !== first)]
    .map(id => metadata[id])
    .filter(md => md != null)
    .flatMap(md => Object.entries(md))
    .filter(([key]) => key !== 'id')
    .reduce(collect, { id: ids })

  for (let [key, value] of Object.entries(data)) {
    if (key !== 'id') {
      value.mixed = value.count !== ids.length
    }
  }

  return data
}

export const getItemMetadata = memo(
  ({ metadata }) => metadata,
  (state) => selectItemSelection(state).ids(),
  selectItemCursor,
  collectMetadata
)

export const getVisibleMetadata = memo(
  ({ items }) => items, selectItemSequence, pluck
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
    let [fld, push] = createSequence()

    if (template != null) {
      for (let f of template.fields) {
        if (compact && (data == null || !(f.property in data))) {
          continue
        }

        push({
          isExtra: false,
          isRequired: f.isRequired,
          isReadOnly: f.isConstant,
          label: f.label,
          placeholder: f.hint,
          property: getProperty(f.property, props, compact),
          type: f.datatype,
          value: (data != null && data[f.property]) || {}
        }, f.property)
      }
    }

    if (data != null) {
      let idx = getIndex(fld)

      for (let id in data) {
        if (id === 'id' || idx.has(id)) continue
        push({
          isExtra: true,
          property: props[id] || { id },
          value: data[id]
        }, id)
      }

      fld.id = data.id
    }

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
  ({ metadata }) => metadata,
  selectPhotoCursor,
  (metadata, id) => id ? collectMetadata(metadata, [id]) : null
)

const getSelectionMetadata = memo(
  ({ metadata }) => metadata,
  selectSelectionCursor,
  (metadata, id) => id ? collectMetadata(metadata, [id]) : null
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

const isCompletable = (value, datatype, maxLength = 100) => (
  value != null &&
  value.type === datatype &&
  value.text?.length > 0 &&
  value.text.length < maxLength
)

const makeCompletionFilter = (prop, datatype, byProp) =>
  byProp ?
      ([id, v]) => id === prop && isCompletable(v, datatype) :
      ([id, v]) => id !== 'id' && isCompletable(v, datatype)

export const getMetadataCompletions = memo(
  ({ metadata }) => metadata,
  (_, { property }) => property,
  (_, { type }) => type,
  (_, { isDisabled }) => isDisabled,
  ({ settings }) => settings.completions === 'property-datatype',

  (metadata, prop, datatype, isDisabled, byProp) => {
    if (isDisabled || prop == null)
      return EMPTY

    let comp = new Set()

    let isCompletion = makeCompletionFilter(prop, datatype, byProp)

    for (let data of Object.values(metadata)) {
      for (let entry of Object.entries(data)) {
        if (isCompletion(entry)) comp.add(entry[1].text)
      }
    }

    return [...comp].sort(compare)
  }
)
