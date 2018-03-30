'use strict'

const assert = require('assert')
const { Ontology, Template } = require('../../../lib/common/ontology')
const mod = require('../../../lib/models/ontology')
const { warn } = require('../../../lib/common/log')
const { join } = require('path')

module.exports = {
  async up(tx) {
    const files = [
      join(Ontology.base, '..', 'ttp', 'correspondence.ttp'),
      join(Ontology.base, '..', 'ttp', 'dc.ttp')
    ]

    const isProtected = true

    for (const file of files) {
      const {
        '@id': id,
        type,
        name,
        version,
        creator,
        description,
        field: fields
      } = await Template.open(file)

      try {
        assert(id != null, 'missing template id')
        assert(name != null, 'missing template name')
        assert(type != null, 'missing template type')

        await mod.template.create(tx, {
          id, type, name, version, creator, description, isProtected
        })

        if (fields != null && fields.length > 0) {
          await Promise.all([
            mod.template.field.add(tx, id, ...fields)
          ])
        }
      } catch (error) {
        warn(`failed to add template ${id}: ${error.message}`)
      }
    }
  }
}
