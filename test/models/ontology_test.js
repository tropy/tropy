import { join } from 'node:path'
import { Database } from '#internal/common/db.js'
import { mkdtmp } from '../support/tmp.js'
import mod from '#internal/models/ontology.js'

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
})
