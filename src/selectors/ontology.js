'use strict'

const { createSelector: memo } = require('reselect')
const { values } = Object
const { by } = require('../collate')
const { into, map } = require('transducers.js')

const getAllProperties = memo(
  ({ ontology }) => ontology.props,
  (props) => values(props).sort(by('id'))
)

const getVocabs = memo(
  ({ ontology }) => ontology.vocab,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.types,
  (vocab, props, types) => into(
    [],
    map(kv => ({
      ...kv[1],
      classes: kv[1].classes.map(id => types[id]),
      properties: kv[1].properties.map(id => props[id])
    })),
    vocab
  )
)

module.exports = {
  getAllProperties,
  getVocabs
}
