'use strict'

const { Ontology } = require('../../../lib/common/ontology')
const mod = require('../../../lib/models/ontology')

const created = '2019-03-02 21:01:44'

module.exports = {
  async up(tx) {
    for (let file of ['xmp', 'photoshop', 'iptc']) {
      let data = (await Ontology.open(file)).toJSON()

      for (let id in data) {
        await mod.vocab.create(tx, {
          ...data[id],
          created,
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
}
