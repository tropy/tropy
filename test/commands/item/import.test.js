import { existsSync, readdirSync } from 'node:fs'
import { join as joinPath } from 'node:path'
import { mock } from 'node:test'
import { runSaga } from 'redux-saga'
import { join } from 'redux-saga/effects'
import { mkprojtmp } from '../../support/project.js'
import { mkdtmp } from '../../support/tmp.js'
import { Import } from '#tropy/commands/item/import.js'
import { Store } from '#tropy/asset/store.js'
import { normalize, eachItem } from '#tropy/common/import.js'
import * as act from '#tropy/actions/index.js'
import { MIME, PHOTO } from '#tropy/constants/index.js'

describe('Import items from JSON', () => {
  let project = mkprojtmp('import.tpy')
  let dir = mkdtmp()
  let store
  let cache

  beforeEach(async () => {
    store = new Store(joinPath(dir, `assets-${Date.now()}`))
    await store.init()
    cache = { consolidate: mock.fn(async () => {}) }
  })

  // Imports the photos as one item and returns the inserted photos.
  let run = async (photos, options) => {
    let [item] = eachItem(await normalize({
      '@graph': [{ photo: photos.map(p => ({ protocol: 'file', ...p })) }]
    }))

    let puts = []
    let cmd = new Import(act.item.import({}), {
      db: project.current.db,
      store,
      cache,
      templates: {
        item: { id: 'https://tropy.org/v1/templates/generic' },
        photo: { id: 'https://tropy.org/v1/templates/photo' }
      },
      ...options
    })

    cmd.backlog = []
    cmd.result = []
    cmd.newLists = []

    await runSaga({ dispatch: (a) => puts.push(a) }, function * () {
      yield * cmd.importJSONItem(item)
      yield join(cmd.backlog)
    }).toPromise()

    return puts.find(a => a.type === PHOTO.INSERT).payload
  }

  let jpg = F.image.path('PA140105.JPG')

  it('copies photos to the store and uses the file data', async () => {
    let [photo] = await run([{ path: jpg }])

    expect(photo.path.startsWith(store.root)).to.be.true
    expect(existsSync(photo.path)).to.be.true
    expect(photo).to.include({ mimetype: 'image/jpeg', filename: 'PA140105.JPG' })
    expect(photo.checksum).not.to.equal('badc0de')
    expect(photo.width).to.be.above(0)
    expect(cache.consolidate.mock.callCount()).to.equal(1)
    expect(cache.consolidate.mock.calls[0].arguments[0]).to.equal(photo.id)
  })

  it('keeps the original filename of photos from another store', async () => {
    let [{ path }] = await run([{ path: jpg }])
    store = new Store(joinPath(dir, 'other-assets'))
    await store.init()

    let [photo] = await run([{ path, filename: 'Letter.jpg' }])

    expect(photo.path.startsWith(store.root)).to.be.true
    expect(photo.filename).to.equal('Letter.jpg')
  })

  it('imports photos already in the store as they are', async () => {
    let [{ path, checksum }] = await run([{ path: jpg }])
    cache.consolidate.mock.resetCalls()

    let [photo] = await run([{
      path, checksum, mimetype: 'image/jpeg', filename: 'Letter.jpg'
    }])

    expect(photo).to.include({ path, checksum, filename: 'Letter.jpg' })
    expect(readdirSync(store.root)).to.have.length(1)
    expect(cache.consolidate.mock.callCount()).to.equal(0)
  })

  it('optimizes new photos if enabled', async () => {
    let [photo] = await run([{
      path: F.image.path('veraPDF test suite 6-9-t03-pass-a.pdf')
    }], { optimizeOnImport: true, optimizeQuality: 0.8 })

    expect(photo.mimetype).to.be.oneOf([MIME.JPG, MIME.PNG])
    expect(photo.page).to.equal(0)
    expect(existsSync(photo.path)).to.be.true
  })

  it('imports photos it cannot open as they are', async () => {
    let path = joinPath(dir, 'missing.jpg')
    let [photo] = await run([{ path }])

    expect(photo).to.include({ path, checksum: 'badc0de' })
    expect(cache.consolidate.mock.callCount()).to.equal(0)
  })
})
