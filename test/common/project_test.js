import { mkdbtmp } from '../support/db.js'
// TODO currently fails in main process!
import pmod from '../../src/models/project.js'
import { pstat } from '../../src/common/project.js'

describe('common/project', () => {
  let tpy = mkdbtmp('test.tpy', pmod.create, { name: 'Amaze' })

  describe('pstat', () => {
    beforeEach(async () => {
      // TODO populate project db
    })

    it('returns .tpy stats', async () => {
      let stats = await pstat(tpy.current.path)

      expect(stats).to.have.property('name', 'Amaze')
      expect(stats).to.have.property('path', tpy.current.path)
      expect(stats).to.have.property('items', 0)
    })

    it('returns null if file not modifed since', () =>
      expect(pstat(tpy.current.path, Date.now() + 1))
        .to.eventually.be.null)

    it('rejects files with unknown extensions', () =>
      expect(pstat('test.txt'))
        .to.eventually.be.rejectedWith('unknown project file extension'))

    it('rejects missing files', () =>
      expect(pstat('test.tpy'))
        .to.eventually.be.rejectedWith('ENOENT'))

    it('rejects files that cannot be opened')
    it('returns .tpm stats')
  })
})
