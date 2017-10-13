'use strict'

const { promises: jsonld } = require('jsonld')

const { camelize, omit } = require('./util')
const { ITEM } = require('../constants/type')
const { TEMPLATE } = require('../constants/ontology')
const { getLabel } = require('./ontology')


function propertyLabel(property, props, template) {
  var label, field
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

function shorten() {
  const label = propertyLabel(...arguments)
  if (label) return shortenLabel(label)
}

function createContext(item_template, metadata, props) {
  var context = {
    _template: { '@id': TEMPLATE.TYPE, '@type': '@id' }
  }

  // add fields to context
  for (const field of item_template.fields) {
    const short = shorten(field.property, props, item_template)
    if (short) {
      context[short] = {
        '@id': field.property,
        '@type': field.datatype
      }
    }
  }

  return context
}

function createDocument(item_template, metadata, props) {
  var document = {
    '@type': ITEM,
    '_template': item_template.id
  }

  // add metadata to document.metadata
  for (const property in metadata) {
    const short = shorten(property, props, item_template)
    if (short) {
      const text = metadata[property].text
      if (text) {
        document[short] = text
      }
    }
  }

  return document
}

function itemToLD() {
  var document = createDocument(...arguments)
  const context = createContext(...arguments)

  document['@context'] = context
  return jsonld.compact(document, context)
}

async function itemFromLD(obj) {
  let metadata, type, templateID
  try {
    const [expanded] = await jsonld.expand(obj)
    type = expanded['@type'][0]
    templateID = expanded[TEMPLATE.TYPE][0]['@id']
    metadata = omit(expanded, ['@type', TEMPLATE.TYPE])
  } catch (e) { return }
  return { type, templateID, metadata }
}

module.exports = {
  shortenLabel,
  propertyLabel,
  itemToLD,
  itemFromLD
}
