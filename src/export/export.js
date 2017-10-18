'use strict'

const { values } = Object
const { promises: jsonld } = require('jsonld')

const { pick } = require('../common/util')
const { ITEM, PHOTO } = require('../constants/type')
const { TEMPLATE } = require('../constants/ontology')

const { newProperties } = require('./utils')

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

  // fill context up with item metadata fields
  const metadataOfItems = values(pick(metadata, items.map(i => i.id)))
  result['item']['@context'] = newProperties(
    metadataOfItems, result['item']['@context'], true, props, template)

  // add Photo metadata fields to context from all selected photos
  const metadataOfPhotos = values(pick(metadata, items.map(i => i.photos)
                                       .reduce((acc, ps) => acc.concat(ps))))
  const newPhotoProperties = newProperties(metadataOfPhotos,
    result['item']['@context']['photo']['@context'], true, props, template)
  result['item']['@context']['photo']['@context'] = newPhotoProperties

  return result
}

function renderItem(item, photos, metadata, template, props) {
  // the item starts with a photo property, it may not be overwritten
  let result = { photo: [] }

  // add item metadata
  result = newProperties(metadata[item.id], result, false, props, template)

  // add photo metadata
  result.photo = values(pick(photos, item.photos)).map(p => {
    let photo = { path: p.path }
    photo = newProperties(metadata[p.id], photo, false, props, template)
    return photo
  })

  // clear property if there are no photos
  if (!result.photo.length) {
    delete result.photo
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
