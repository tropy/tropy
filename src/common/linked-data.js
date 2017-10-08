'use strict'

const { select } = require('redux-saga/effects')
const { pick } = require('./util')
// const jsonld = require('jsonld')
const { ITEM } = require('../constants/type')

function* itemToLD(item_id, callback) {
  const resources = yield select(state => {
    const item = state.items[item_id]
    return {
      item,
      item_template: state.ontology.template[item.template],
      photos: pick(state.photos, item.photos),
      metadata: state.metadata[item_id]
    }
  })

  let context = {
    //! metadata: {},
    /*
    photos: {
      '@container': '@list',
      '@context': {
        "path": {
          '@'
        }
      }
    }
    */
  }

  // add fields to context
  resources.item_template.fields.forEach(field => {
    context[field.property] = {
      '@id': field.property,
      '@type': field.datatype
    }
  })

  let document = {
    '@context': context,
    '@type': ITEM,
    //! metadata: {},
    // 'photos': []
  }

  // add metadata to document.metadata
  for (var property in resources.metadata) {
    document[property] = resources.metadata[property].text ||
      resources.metadata[property]
  }

  // add photos to document.photos
  /*
  for (var photo_id in resources.photos) {
    const photo = resources.photos[photo_id]
    document.photos.push(photo)
  }
  */

  callback(null, document)
  // return document
  // return jsonld.compact(document, context, callback)
}

module.exports = {
  itemToLD
}
