'use strict'

const { VOCAB, RDFS, DC, DCT, SKOS } = require('../constants')
const { Vocab } = require('../common/res')
const { update } = require('./properties')
const { any, get } = require('../common/util')


module.exports = {
  load(payload) {
    return async (dispatch) => {
      const store = await Vocab.open(payload)
      const { vocabularies, properties, collect } = store
      const [main] = vocabularies

      const vocabs = vocabularies
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


      const props = properties
        .reduce((acc, uri) => {
          let data = collect(uri)
          let vocab = vocabs[get(data, [RDFS.isDefinedBy, 'value'], main)]

          if (vocab) vocab.properties.push(uri)

          acc[uri] = {
            uri,
            label: get(data[RDFS.label], ['value']),
            definition: get(
              any(data, DC.description, DCT.description, SKOS.definition),
              ['value']
            ),
            comment: get(data[RDFS.comment], ['value'])
          }
          return acc
        }, {})

      dispatch(update(props))
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
