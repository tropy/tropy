'use strict'

const { promises: jsonld } = require('jsonld')

const { camelize } = require('./util')
const { ITEM } = require('../constants/type')
const { TEMPLATE } = require('../constants/ontology')
const { getLabel } = require('./ontology')


function propertyLabel(property, props, template) {
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
    return label
  } catch (_) { return label }
}

function shortenLabel(label) {
  return camelize(
    label
    .toLowerCase()
    .trim()
    .normalize('NFD')                // normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // remove accents, ligatures
    .replace(/[^a-zA-Z0-9]+/g, ' ')  // remove non-alphanumeric
  ).replace('_', ' ')                // remove _
}

function shorten(property, props, template) {
  const label = propertyLabel(property, props, template)
  if (label) return shortenLabel(label)
}

function itemToLD(resources) {

  let context = {
    _template: { '@id': TEMPLATE.TYPE, '@type': '@id' }
  }

  // add fields to context
  resources.item_template.fields.forEach(field => {
    const short = shorten(
      field.property,
      resources.props,
      resources.item_template)
    if (short) {
      context[short] = {
        '@id': field.property,
        '@type': field.datatype
      }
    }
  })

  let document = {
    '@context': context,
    '@type': ITEM,
    '_template': resources.item_template.id
  }

  // add metadata to document.metadata
  for (var property in resources.metadata) {
    const short = shorten(
      property,
      resources.props,
      resources.item_template)
    if (short) {
      const text = resources.metadata[property].text
      if (text) {
        document[short] = text
      }
    }
  }

  return jsonld.compact(document, context)
}

module.exports = {
  shortenLabel,
  propertyLabel,
  itemToLD
}
