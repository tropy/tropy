import { join } from 'node:path'
import { Database } from '#tropy/common/db.js'
import { mkdtmp } from '../support/tmp.js'
import mod from '#tropy/models/ontology.js'

describe('models.ontology', () => {
  let tmp = mkdtmp()

  describe('create', () => {
    it('creates a new ontology db from the schema', async () => {
      let db = new Database(join(tmp, 'o.db'), 'w+')
      await mod.create(db)

      let { vocab } = await db.get('SELECT count(*) as vocab FROM vocabularies')
      expect(vocab).to.be.greaterThan(10)
      await db.close()
    })
  })

  describe('given an ontology db', () => {
    let db
    let n = 0

    beforeEach(async () => {
      db = new Database(join(tmp, `g${++n}.db`), 'w+')
      await mod.create(db)
    })

    afterEach(async () => {
      await db.close()
    })

    it('creates properties, classes, datatypes and labels', async () => {
      let vocabulary = 'https://example.com/ns#'
      await mod.vocab.create(db, { id: vocabulary, title: 'Example' })

      await mod.props.create(db,
        { id: `${vocabulary}a`, vocabulary, description: 'A' },
        { id: `${vocabulary}b`, vocabulary, comment: 'B' })
      await mod.class.create(db, { id: `${vocabulary}C`, vocabulary })
      await mod.type.create(db, { id: `${vocabulary}T`, vocabulary })
      await mod.label.save(db,
        { id: `${vocabulary}a`, language: 'en', label: 'Alpha' })

      let props = await mod.props.load(db, vocabulary)

      expect(props).to.have.keys(`${vocabulary}a`, `${vocabulary}b`)
      expect(props[`${vocabulary}a`]).to.include({
        description: 'A', comment: null, label: 'Alpha'
      })
      expect(props[`${vocabulary}b`]).to.include({ comment: 'B' })

      expect(await mod.class.load(db, vocabulary))
        .to.have.keys(`${vocabulary}C`)
      expect(await mod.type.load(db, vocabulary))
        .to.have.keys(`${vocabulary}T`)
    })

    it('adds template fields with labels', async () => {
      let id = 'https://example.com/template'
      await mod.template.create(db, {
        id, type: 'https://tropy.org/v1/tropy#Item', name: 'Test'
      })

      let res = await mod.template.field.add(db, id,
        { property: 'http://purl.org/dc/elements/1.1/title', label: 'T' },
        { property: 'http://purl.org/dc/elements/1.1/date' })

      expect(res).to.have.length(2)

      let fields = await db.all(`
        SELECT field_id AS id, position, label
          FROM fields LEFT JOIN field_labels USING (field_id)
          WHERE template_id = ?
          ORDER BY position`, id)

      expect(fields).to.eql([
        { id: res[0].id, position: 0, label: 'T' },
        { id: res[1].id, position: 1, label: null }
      ])
    })

    it('orders template fields', async () => {
      let id = 'https://example.com/template'
      await mod.template.create(db, {
        id, type: 'https://tropy.org/v1/tropy#Item', name: 'Test'
      })

      let [a, b] = await mod.template.field.add(db, id,
        { property: 'http://purl.org/dc/elements/1.1/title' },
        { property: 'http://purl.org/dc/elements/1.1/date' })

      await mod.template.field.order(db, id, [b.id, a.id])

      expect((await mod.template.load(db, id))[id].fields.map(f => f.id))
        .to.eql([b.id, a.id])
    })
  })
})
