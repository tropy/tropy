import { existsSync, readdirSync } from 'node:fs'
import { join as joinPath } from 'node:path'
import { mock } from 'node:test'
import { runSaga } from 'redux-saga'
import { join } from 'redux-saga/effects'
import { mkprojtmp } from '../../support/project.js'
import { mkdtmp } from '../../support/tmp.js'
import { Import } from '#tropy/commands/item/import.js'
import { Store } from '#tropy/asset/store.js'
import { Image } from '#tropy/image/index.js'
import { normalize, eachItem } from '#tropy/common/import.js'
import * as act from '#tropy/actions/index.js'
import { MIME, PHOTO } from '#tropy/constants/index.js'

describe('Import items', () => {
  let project = mkprojtmp('import.tpy')
  let dir = mkdtmp()
  let count = 0
  let store
  let cache
  let thumbnails

  let jpg = F.image.path('PA140105.JPG')
  let tif = F.image.path('pages.tif') // 3 pages: 8x6, 6x8, 4x4

  beforeEach(async () => {
    store = new Store(joinPath(dir, `assets-${++count}`))
    await store.init()
    thumbnails = []
    cache = {
      consolidate: mock.fn(async (id, image) => {
        thumbnails.push([image.page, id])
      })
    }
  })

  // Runs the import step and returns the inserted photos.
  let run = async (step, options) => {
    let puts = []
    let cmd = new Import(act.item.import({}, { duplicate: 'import' }), {
      db: project.current.db,
      store,
      cache,
      templates: {
        item: { id: 'https://tropy.org/v1/templates/generic', fields: [] },
        photo: { id: 'https://tropy.org/v1/templates/photo', fields: [] },
        selection: { id: 'https://tropy.org/v1/templates/selection', fields: [] }
      },
      ...options
    })

    cmd.backlog = []
    cmd.result = []
    cmd.newLists = []

    await runSaga({
      dispatch: (a) => puts.push(a),
      getState: () => ({ settings: { title: {} } })
    }, function * () {
      yield * step(cmd)
      yield join(cmd.backlog)
    }).toPromise()

    let insert = puts.find(a => a.type === PHOTO.INSERT)
    if (!insert) throw new Error('no photos imported')

    return insert.payload
  }

  // Pages and photo ids passed to thumbnail generation.
  let consolidated = () => thumbnails

  describe('from images', () => {
    let importImage = (path, options) =>
      run(cmd => cmd.importFromImage(path), options)

    it('copies images to the store', async () => {
      let [photo] = await importImage(jpg)

      expect(existsSync(photo.path)).to.be.true
      expect(photo.path.startsWith(store.root)).to.be.true
      expect(consolidated()).to.eql([[0, photo.id]])
    })

    it('imports each page as a photo', async () => {
      let photos = await importImage(tif)

      expect(photos.map(p => [p.page, p.width, p.height]))
        .to.eql([[0, 8, 6], [1, 6, 8], [2, 4, 4]])
      expect(readdirSync(store.root)).to.have.length(1)
      expect(consolidated()).to.eql(photos.map(p => [p.page, p.id]))
    })

    it('optimizes each page if enabled', async () => {
      let photos = await importImage(tif, {
        optimizeOnImport: true,
        optimizeQuality: 0.8
      })

      expect(photos.map(p => [p.page, p.width, p.mimetype]))
        .to.eql([[0, 8, MIME.JPG], [0, 6, MIME.JPG], [0, 4, MIME.JPG]])
      expect(readdirSync(store.root)).to.have.length(3)
      expect(consolidated()).to.eql(photos.map((p, page) => [page, p.id]))
    })
  })

  describe('from JSON', () => {
    let importJSON = async (photos, options) => {
      let [item] = eachItem(await normalize({
        '@graph': [{ photo: photos.map(p => ({ protocol: 'file', ...p })) }]
      }))

      return run(cmd => cmd.importJSONItem(item), options)
    }

    it('copies photos to the store and uses the file data', async () => {
      let [photo] = await importJSON([{ path: jpg }])

      expect(photo.path.startsWith(store.root)).to.be.true
      expect(existsSync(photo.path)).to.be.true
      expect(photo).to.include({ mimetype: 'image/jpeg', filename: 'PA140105.JPG' })
      expect(photo.checksum).not.to.equal('badc0de')
      expect(photo.width).to.be.above(0)
      expect(consolidated()).to.eql([[0, photo.id]])
    })

    it('keeps the original filename of photos from another store', async () => {
      let [{ path }] = await importJSON([{ path: jpg }])
      store = new Store(joinPath(dir, 'other-assets'))
      await store.init()

      let [photo] = await importJSON([{ path, filename: 'Letter.jpg' }])

      expect(photo.path.startsWith(store.root)).to.be.true
      expect(photo.filename).to.equal('Letter.jpg')
    })

    it('imports photos already in the store as they are', async () => {
      let [{ path, checksum }] = await importJSON([{ path: jpg }])
      thumbnails = []

      let [photo] = await importJSON([{
        path, checksum, mimetype: 'image/jpeg', filename: 'Letter.jpg'
      }])

      expect(photo).to.include({ path, checksum, filename: 'Letter.jpg' })
      expect(readdirSync(store.root)).to.have.length(1)
      expect(consolidated()).to.eql([])
    })

    it('optimizes new photos if enabled', async () => {
      let [photo] = await importJSON([{
        path: F.image.path('veraPDF test suite 6-9-t03-pass-a.pdf')
      }], { optimizeOnImport: true, optimizeQuality: 0.8 })

      expect(photo.mimetype).to.be.oneOf([MIME.JPG, MIME.PNG])
      expect(photo.page).to.equal(0)
      expect(existsSync(photo.path)).to.be.true
    })

    it('opens each file once for all its pages', async () => {
      let open = mock.method(Image, 'open')
      let photos = await importJSON([0, 1, 2].map(page => ({ path: tif, page })))
      open.mock.restore()

      expect(open.mock.callCount()).to.equal(1)
      expect(photos.map(p => [p.page, p.width, p.height]))
        .to.eql([[0, 8, 6], [1, 6, 8], [2, 4, 4]])
      expect(readdirSync(store.root)).to.have.length(1)
      expect(consolidated()).to.eql(photos.map(p => [p.page, p.id]))
    })

    it('optimizes each page of a file if enabled', async () => {
      let photos = await importJSON([0, 1, 2].map(page => ({ path: tif, page })), {
        optimizeOnImport: true,
        optimizeQuality: 0.8
      })

      expect(photos.map(p => [p.page, p.width, p.mimetype]))
        .to.eql([[0, 8, MIME.JPG], [0, 6, MIME.JPG], [0, 4, MIME.JPG]])
      expect(readdirSync(store.root)).to.have.length(3)
      expect(consolidated()).to.eql(photos.map((p, page) => [page, p.id]))
    })

    it('creates thumbnails of selections', async () => {
      let [photo] = await importJSON([{
        path: jpg,
        selection: [{ x: 0, y: 0, width: 10, height: 10 }]
      }])

      expect(consolidated())
        .to.eql([[0, photo.id], [0, photo.selections[0]]])
    })

    it('imports a single page of a file', async () => {
      let [photo] = await importJSON([{ path: tif, page: 2 }])

      expect(photo).to.include({ page: 2, width: 4, height: 4 })
      expect(consolidated()).to.eql([[2, photo.id]])
    })

    it('imports photos it cannot open as they are', async () => {
      let path = joinPath(dir, 'missing.jpg')
      let [photo] = await importJSON([{ path }])

      expect(photo).to.include({ path, checksum: 'badc0de' })
      expect(consolidated()).to.eql([])
    })
  })
})
