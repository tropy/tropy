'use strict'

const { Ontology } = require('../../../lib/common/ontology')
const mod = require('../../../lib/models/ontology')
const { assign } = Object

module.exports = {
  async up(tx) {
    const files = [
      Ontology.expand('tropy'),
      Ontology.expand('xsd'),
      Ontology.expand('dc'),
      Ontology.expand('dcterms'),
      Ontology.expand('rdf'),
      Ontology.expand('rdfs')
    ]

    for (const file of files) {
      let data = (await Ontology.open(file, false)).toJSON()

      for (let id in data) {
        await mod.vocab.create(tx, assign(data[id], { isProtected: true }))

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
