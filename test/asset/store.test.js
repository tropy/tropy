import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { mkdtmp } from '../support/tmp.js'
import { Store } from '#tropy/asset/store.js'

describe('Store', () => {
  let dir = mkdtmp()
  let store = new Store(join(dir, 'assets'))

  // A checksum that points outside the store, e.g. from crafted JSON.
  let outside = { checksum: '../secret', path: join(dir, 'secret.jpg') }

  it('owns only its generated paths', () => {
    expect(store.owns({ checksum: 'abc', path: join(store.root, 'abc.jpg') })).to.be.true
    expect(store.owns({ checksum: 'abc', path: join(dir, 'abc.jpg') })).to.be.false
    expect(store.owns(outside)).to.be.false
  })

  it('removes nothing it does not own', async () => {
    writeFileSync(outside.path, '')
    await store.remove(outside)
    expect(existsSync(outside.path)).to.be.true
  })
})
