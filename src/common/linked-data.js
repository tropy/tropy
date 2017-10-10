'use strict'

const { select } = require('redux-saga/effects')
const { pick, camelize } = require('./util')
const { ITEM } = require('../constants/type')
const { getLabel } = require('./ontology')


function shortenProperty(property, props, template) {
  let label, field
  try {
    if (template) {
      field = template.fields.find(f => f.property === property)
      label = field.label
    }
    if (!label) {
      label = props[property] && props[property].label
    }
    if (!label) {
      label = getLabel(field.id)
    }
    if (!label) return
  } catch (_) { return }
  return camelize(
    label
    .toLowerCase()
    .trim()
    .normalize('NFD')                 // normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // remove accents, ligatures
  )
}

function* itemToLD(item_id, callback) {

  // extract useful data from current state
  const resources = yield select(state => {
    const item = state.items[item_id]
    return {
      item,
      item_template: state.ontology.template[item.template],
      photos: pick(state.photos, item.photos),
      metadata: state.metadata[item_id],
      ontology: state.ontology
    }
  })

  let context = {
  }

  // add fields to context
  resources.item_template.fields.forEach(field => {
    const short = shortenProperty(
      field.property, resources.ontology.props, resources.item_template)
    context[short] = {
      '@id': field.property,
      '@type': field.datatype
    }
  })

  let document = {
    '@context': context,
    '@type': ITEM,
  }

  // add metadata to document.metadata
  for (var property in resources.metadata) {
    const short = shortenProperty(
      property, resources.ontology.props, resources.item_template)
    if (short) {
      const text = resources.metadata[property].text
      if (text) {
        document[short] = text
      }
    }
  }

  callback(null, document)
}

module.exports = {
  shortenProperty, // exported for testing (not used in the src)
  itemToLD
}
