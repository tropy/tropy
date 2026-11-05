import { stat, utimes } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdtmp } from '../support/tmp.js'
import { Cache } from '#tropy/common/cache.js'

describe('Cache', () => {
  describe('init', () => {
    // Other windows purge caches by their mtime.
    it('marks an existing cache as used', async () => {
      let cache = await new Cache(join(mkdtmp(), 'x')).init()
      let old = new Date(2020, 0, 1)
      await utimes(cache.root, old, old)

      await cache.init()

      expect((await stat(cache.root)).mtimeMs).to.be.above(old.getTime())
    })
  })
})
