'use strict'

const { promises: jsonld } = require('jsonld')

const { pick } = require('../common/util')
const { shorten } = require('./utils')
const { ITEM, PHOTO } = require('../constants/type')
const { TEMPLATE } = require('../constants/ontology')
const { entries, values, keys } = Object

function makeContext(items, photos, metadata, template, props) {
  const result = {
    '@vocab': 'https://tropy.org/v1/tropy#',
    'template': TEMPLATE.TYPE,
    'item': {
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
    const key = shorten(field.property, props, template)
    const valid = !!validProperties.has(field.property)
    if (key && valid) {
      result['item']['@context'][key] = {
        '@id': field.property,
        '@type': field.datatype
      }
    }
  }

  // fill context up with metadata fields
  for (const itemMetadata of values(metadata)) {
    for (const [property, { type }] of entries(itemMetadata)) {
      const key = shorten(property, props, template)
      const alreadySet = !!result['item']['@context'][key]
      const valid = !!validProperties.has(property)
      if (key && valid && !alreadySet) {
        result['item']['@context'][key] = { '@id': property, '@type': type }
      }
    }
  }

  // TODO add Photo metadata to context
  result['item']['@context']['photo'] = {
    '@id': PHOTO,
    '@container': '@list',
    '@context': {
      path: 'http://schema.org/image'
    }
  }

  return result
}

function renderItem(item, photos, metadata, template, props) {
  let result = {}
  // add metadata
  for (const property in metadata[item.id]) {
    const key = shorten(property, props, template)
    if (key) {
      const text = metadata[item.id][property].text
      if (text) {
        result[key] = text
      }
    }
  }

  // add photos
  const itemPhotos = values(pick(photos, item.photos))
  if (itemPhotos.length) {
    result.photo = itemPhotos.map(p => ({ path: p.path }))
  }
  return result
}

function makeDocument(items, photos, metadata, template, props) {
  const result = {
    template: template.id,
    item: []
  }
  for (const i in items) {
    const item = items[i]
    const rendered = renderItem(item, photos, metadata, template, props)
    result.item.push(rendered)
  }
  return result
}

async function groupedByTemplate(resources, props = {}) {
  const results = []
  for (const r in resources) {
    const { items, metadata, template, photos } = resources[r]
    const context = makeContext(items, photos, metadata, template, props)
    const document = makeDocument(items, photos, metadata, template, props)
    document['@context'] = context
    results.push(await jsonld.compact(document, context))
  }
  return results
}

module.exports = {
  groupedByTemplate
}
