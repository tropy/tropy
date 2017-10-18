'use strict'

const { promises: jsonld } = require('jsonld')

const { shorten } = require('./utils')
const { ITEM } = require('../constants/type')
const { TEMPLATE } = require('../constants/ontology')
const { entries, values, keys } = Object

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

module.exports = {
  groupedByTemplate
}
