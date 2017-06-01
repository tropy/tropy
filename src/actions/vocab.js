'use strict'

const { VOCAB } = require('../constants')
const { Ontology } = require('../common/ontology')

const act = {
  classes: require('./classes'),
  properties: require('./properties')
}

module.exports = act.vocab = {
  load(payload) {
    return async (dispatch) => {
      let store = await Ontology.open(payload)
      let data = store.toJSON()

      let vocabs = {}
      let classes = {}
      let properties = {}

      for (let id in data) {
        for (let cls of data[id].classes) classes[cls.id] = cls
        for (let prp of data[id].properties) properties[prp.id] = prp

        vocabs[id] = {
          ...data[id],
          classes: data[id].classes.map(p => p.id),
          properties: data[id].properties.map(p => p.id)
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
