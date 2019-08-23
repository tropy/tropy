'use strict'

const { Ontology } = require('../../../lib/common/ontology')
const mod = require('../../../lib/models/ontology')

const created = '2019-03-02 21:01:44'

module.exports = {
  async up(tx) {
    const files = [
      [Ontology.expand('tropy'), true],
      [Ontology.expand('xsd'), true],
      [Ontology.expand('dc'), true],
      [Ontology.expand('dcterms'), true],
      [Ontology.expand('rdf'), true],
      [Ontology.expand('rdfs'), true],
      [Ontology.expand('ore'), false],
      [Ontology.expand('skos'), false],
      [Ontology.expand('edm'), false]
    ]

    for (const [file, isProtected] of files) {
      let data = (await Ontology.open(file, false)).toJSON()

      for (let id in data) {
        await mod.vocab.create(tx, { ...data[id], isProtected, created })

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
