'use strict'

const { createSelector: memo } = require('reselect')
const { into, map } = require('transducers.js')

const getVocabs = memo(
  ({ vocab }) => vocab,
  ({ properties }) => properties,
  ({ classes }) => classes,
  (vocab, properties, classes) => into(
    [],
    map(kv => ({
      ...kv[1],
      classes: kv[1].classes.map(uri => classes[uri]),
      properties: kv[1].properties.map(uri => properties[uri])
    })),
    vocab
  )
)

module.exports = {
  getVocabs
}
