import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdtmp } from '../support/tmp.js'
import { Migration } from '#tropy/common/migration.js'

describe('Migration', () => {
  describe('constructor', () => {
    it('extracts version number from path', () => {
      expect(new Migration('/tmp/1234.example.js'))
        .to.have.property('number', 1234)
      expect(new Migration('/tmp/1234.js'))
        .to.have.property('number', 1234)
    })

    it('sets the migration type', () => {
      expect(new Migration('/tmp/1234.example.js'))
        .to.have.property('type', 'js')
      expect(new Migration('/tmp/1234.example.sql'))
        .to.have.property('type', 'sql')
      expect(new Migration('/tmp/1234.sql'))
        .to.have.property('type', 'sql')
    })
  })

  describe('compatibility', () => {
    let dir = mkdtmp()

    it('is read from the SQL directive', async () => {
      await writeFile(join(dir, '1.a.sql'), 'SELECT 1;')
      await writeFile(join(dir, '2.b.sql'), '-- compatibility: 2\nSELECT 2;')

      expect(await Migration.compatibility(dir)).to.equal(2)
    })
  })

  describe('fresh', () => {
    it('is true by default', () => {
      expect(new Migration('1.js').fresh()).to.be.true
      expect(new Migration('1.js').fresh(null)).to.be.true
    })

    it('is true if number is greater than given number', () => {
      expect(new Migration('1.js').fresh(0)).to.be.true
      expect(new Migration('1.js').fresh(1)).to.be.false
      expect(new Migration('1.js').fresh(2)).to.be.false
      expect(new Migration('2.js').fresh(1)).to.be.true
    })
  })
})
