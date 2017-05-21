'use strict'

const { VOCAB } = require('../constants')
const { Vocab } = require('../common/vocab')

const act = {
  classes: require('./classes'),
  properties: require('./properties')
}

module.exports = act.vocab = {
  load(payload) {
    return async (dispatch) => {
      let store = await Vocab.open(payload)
      let data = store.toJSON()

      let vocabs = {}
      let classes = {}
      let properties = {}

      for (let uri in data) {
        for (let cls of data[uri].classes) classes[cls.uri] = cls
        for (let prp of data[uri].properties) properties[prp.uri] = prp

        vocabs[uri] = {
          ...data[uri],
          classes: data[uri].classes.map(p => p.uri),
          properties: data[uri].properties.map(p => p.uri)
        }
      }

      dispatch(act.properties.update(properties))
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
