'use strict'

const { select } = require('redux-saga/effects')
const { pick } = require('./util')

function* itemToLD(item_id) {
  let result = {}

  const resources = yield select(state => {
    const item = state.items[item_id]
    return {
      item,
      template: state.ontology.template[item.template],
      photos: pick(state.photos, item.photos),
      metadata: state.metadata[item_id]
    }
  })

  return result
}

module.exports = {
  itemToLD
}
