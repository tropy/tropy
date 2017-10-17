'use strict'

const { promises: jsonld } = require('jsonld')

const { camelize, omit } = require('./util')
const { ITEM } = require('../constants/type')
const { TEMPLATE } = require('../constants/ontology')
const { getLabel } = require('./ontology')
const { entries, values, keys } = Object



function propertyLabel(property, props, template) {
  var label, field
  try {
    if (template) {
      field = template.fields.find(f => f.property === property)
      label = field && field.label
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

function makeContext(metadata, template, props) {
  const result = {
    '@vocab': 'https://tropy.org/v1/tropy#',
    'template': TEMPLATE.TYPE,
    'items': {
      '@id': ITEM,
      '@container': '@list',
      '@context': {}
    }
  }

  // don't include fields that have no metadata set
  const validProperties = new Set()
  for (const itemMetadata of values(metadata)) {
    for (const property of keys(itemMetadata)) {
      validProperties.add(property)
    }
  }

  // fill context up with template items
  for (const field of template.fields) {
    const short = shorten(field.property, props, template)
    const valid = !!validProperties.has(field.property)
    if (short && valid) {
      result['items']['@context'][short] = {
        '@id': field.property,
        '@type': field.datatype
      }
    }
  }

  // fill context up with metadata fields
  for (const itemMetadata of values(metadata)) {
    for (const [property, { type }] of entries(itemMetadata)) {
      const short = shorten(property, props, template)
      const alreadySet = !!result['items']['@context'][short]
      const valid = !!validProperties.has(property)
      if (short && valid && !alreadySet) {
        result['items']['@context'][short] = { '@id': property, '@type': type }
      }
    }
  }

  return result
}

function makeDocument(items, metadata, template, props) {
  const result = {
    template: template.id,
    items: []
  }
  for (const i in items) {
    const item = items[i]
    let doc = {}
    // fill items up with metadata
    for (const property in metadata[item.id]) {
      const short = shorten(property, props, template)
      if (short) {
        const text = metadata[item.id][property].text
        if (text) {
          doc[short] = text
        }
      }
    }
    result.items.push(doc)
  }
  return result
}

async function groupedByTemplate(resources, props = {}) {
  const results = []
  for (const r in resources) {
    const { items, template, metadata } = resources[r]
    const context = makeContext(metadata, template, props)
    const document = makeDocument(items, metadata, template, props)
    document['@context'] = context
    results.push(await jsonld.compact(document, context))
  }
  return results
}

//////// Import

class ParseError extends Error {
  constructor(obj, ...args) {
    super(...args)
    Error.captureStackTrace(this, ParseError)

    this.details = JSON.stringify(obj, null, 2)
  }
}

async function itemFromLD(obj) {
  let metadata, type, templateID
  try {
    const [expanded] = await jsonld.expand(obj)
    type = expanded['@type'][0]
    templateID = expanded[TEMPLATE.TYPE][0]['@id']
    metadata = omit(expanded, ['@type', TEMPLATE.TYPE])
  } catch (e) {
    throw new ParseError(obj, 'Could not parse jsonld object')
  }

  // convert metadata to a format supported by `mod.item.create`
  let md = {}
  for (let property in metadata) {
    const [prop] = metadata[property]
    md[property] =  {
      type: prop['@type'],
      text: prop['@value']
    }
  }

  return { type, templateID, metadata: md }
}

module.exports = {
  shortenLabel,
  propertyLabel,
  itemFromLD,
  ParseError,
  groupedByTemplate
}
