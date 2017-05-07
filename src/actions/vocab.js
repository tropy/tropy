'use strict'

const { VOCAB, RDFS, DC, DCT } = require('../constants')
const { Vocab } = require('../common/res')
const properties = require('./properties')
const { any, get } = require('../common/util')


module.exports = {
  load(payload) {
    return async (dispatch) => {
      const store = await Vocab.open(payload)


      const vocabs = store.vocabularies
        .reduce((acc, uri) => {
          let data = store.collect(uri)
          acc[uri] = {
            uri,
            data,
            properties: [],
            title: get(any(data, DC.title, DCT.title), ['value']),
            description:
              get(any(data, DC.description, DCT.description), ['value']),
          }
          return acc
        }, {})

      const props = store.properties
        .reduce((acc, uri) => {
          let data = store.collect(uri)
          vocabs[data[RDFS.isDefinedBy].value].properties.push(uri)
          acc[uri] = {
            uri,
            label: get(data[RDFS.label], ['value']),
            definition:
              get(any(data, DC.description, DCT.description), ['value']),
            comment: get(data[RDFS.comment], ['value'])
          }
          return acc
        }, {})

      dispatch(properties.update(props))
      dispatch(module.exports.update(vocabs))
    }

  },

  update(payload) {
    return {
      type: VOCAB.UPDATE,
      payload
    }
  }
}
