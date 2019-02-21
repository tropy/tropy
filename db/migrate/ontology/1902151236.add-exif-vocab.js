'use strict'

const { Ontology } = require('../../../lib/common/ontology')
const mod = require('../../../lib/models/ontology')

module.exports = {
  async up(tx) {
    let data = (await Ontology.open('exif')).toJSON()

    for (let id in data) {
      await mod.vocab.create(tx, {
        ...data[id],
        isProtected: true
      })

      await Promise.all([
        mod.props.create(tx, ...data[id].properties),
        mod.class.create(tx, ...data[id].classes),
        mod.type.create(tx, ...data[id].datatypes),
        mod.label.save(tx, ...data[id].labels)
      ])
    }
  }
}
