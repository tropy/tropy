'use strict'

const { VOCAB, RDFS, DC, DCT, SKOS, VANN } = require('../constants')
const { Vocab } = require('../common/res')
const { any, empty, get } = require('../common/util')

const act = {
  classes: require('./classes'),
  properties: require('./properties')
}

module.exports = act.vocab = {
  load(payload) {
    return async (dispatch) => {
      const store = await Vocab.open(payload)
      const vocabs = {}

      function getVocabulary(uri, triples) {
        let ns = Vocab.isDefinedBy(uri, triples)

        if (!vocabs[ns]) {
          let data = store.collect(ns)
          if (empty(data)) return null

          vocabs[ns] = {
            uri: ns,
            prefix:
              get(data, [VANN.preferredNamespacePrefix, 'value'], store.name),
            data,
            classes: [],
            properties: [],
            title: get(any(data, DC.title, DCT.title), ['value']),
            description:
              get(any(data, DC.description, DCT.description), ['value']),
          }
        }

        return vocabs[ns]
      }

      const props = store.getProperties().reduce((acc, uri) => {
        let data = store.collect(uri)

        let vocab = getVocabulary(uri, data)

        if (vocab) vocab.properties.push(uri)
        else return acc

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

      const classes = store.getClasses().reduce((acc, uri) => {
        let data = store.collect(uri)

        let vocab = getVocabulary(uri, data)
        if (vocab) vocab.classes.push(uri)

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

      dispatch(act.properties.update(props))
      dispatch(act.classes.update(classes))
      dispatch(act.vocab.update(vocabs))
    }

  },

  update(payload) {
    return {
      type: VOCAB.UPDATE,
      payload
    }
  }
}
