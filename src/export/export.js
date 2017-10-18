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

  result['item']['@context']['photo'] = {
    '@id': PHOTO,
    '@container': '@list',
    '@context': {
      path: 'http://schema.org/image'
    }
  }

  const mdItems = values(pick(metadata, items.map(i => i.id)))

  // don't include fields that have no metadata set
  // validProperties is a set of item properties that have metadata
  const validProperties = new Set()
  for (const itemMetadata of mdItems) {
    for (const property of keys(itemMetadata)) {
      validProperties.add(property)
    }
  }

  // fill context up with template items (that have metadata)
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

  // fill context up with item metadata fields
  for (const itemMetadata of mdItems) {
    for (const [property, { type }] of entries(itemMetadata)) {
      const key = shorten(property, props, template)
      const alreadySet = !!result['item']['@context'][key]
      if (key && !alreadySet) {
        result['item']['@context'][key] = { '@id': property, '@type': type }
      }
    }
  }

  // add Photo metadata fields to context
  const mdPhotos = values(pick(metadata, items.map(i => i.photos)
                               .reduce((acc, ps) => acc.concat(ps))))

  for (const photoMetadata of mdPhotos) {
    for (const [property, { type }] of entries(photoMetadata)) {
      const key = shorten(property, props, template)
      const alreadySet = !!result['item']['@context']['photo']['@context'][key]
      if (key && !alreadySet) {
        result['item']['@context']['photo']['@context'][key] =
          { '@id': property, '@type': type }
      }
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
    result.photo = itemPhotos.map(p => {
      let photo = {
        path: p.path
      }

      // add photo metadata
      const photoMetadata = metadata[p.id] || {}

      for (const [property, { text }] of entries(photoMetadata)) {
        const key = shorten(property, props, template)
        if (key && text) {
          photo[key] = text
        }
      }

      return photo
    })

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
