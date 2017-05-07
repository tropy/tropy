'use strict'

const { createSelector: memo } = require('reselect')
const { into, map } = require('transducers.js')

const getVocabs = memo(
  ({ vocab }) => vocab,
  ({ properties }) => properties,
  (vocab, properties) => into(
    [],
    map(kv => ({
      ...kv[1], properties: kv[1].properties.map(uri => properties[uri])
    })),
    vocab
  )
)

module.exports = {
  getVocabs
}
