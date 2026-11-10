import { mkprojtmp } from '../support/project.js'
import image from '#tropy/models/image.js'
import item from '#tropy/models/item.js'
import metadata from '#tropy/models/metadata.js'
import note from '#tropy/models/note.js'
import photo from '#tropy/models/photo.js'
import selection from '#tropy/models/selection.js'
import * as transcription from '#tropy/models/transcription.js'
import value from '#tropy/models/value.js'
import sql from '#tropy/common/sql.js'
import { TYPE } from '#tropy/constants/index.js'

const TEMPLATE = 'https://tropy.org/v1/templates/photo'

const annotate = (db, id, text) => Promise.all([
  note.create(db, { id, text, state: {} }),
  transcription.create(db, { parent: id, text })
])

describe('models/photo', () => {
  let tpy = mkprojtmp('photo.tpy', { name: 'Photos' })
  let db
  let original

  // A photo with a note, a transcription, and one annotated selection.
  beforeEach(async () => {
    db = tpy.current.db

    let { id: parent } = await item.create(db, TEMPLATE)
    let { id } = await photo.create(db, { template: TEMPLATE }, {
      item: parent,
      data: {},
      image: {
        path: 'photo.jpg',
        checksum: '123',
        mimetype: 'image/jpeg',
        width: 640,
        height: 480,
        angle: 90
      }
    })

    await annotate(db, id, 'photo')

    let { id: sid } = await selection.create(db, {
      template: TEMPLATE, photo: id, x: 1, y: 2, width: 3, height: 4
    })

    await annotate(db, sid, 'selection')

    original = (await photo.load(db, [id]))[id]
  })

  describe('dup', () => {
    let copy

    beforeEach(async () => {
      copy = await photo.dup(db, original.id)
    })

    it('creates a new photo in the same item', () => {
      expect(copy.photo.id).not.to.equal(original.id)
      expect(copy.photo).to.include({
        item: original.item,
        template: TEMPLATE,
        path: original.path,
        width: 640,
        height: 480,
        angle: 90
      })
    })

    it('copies notes, transcriptions, and selections', () => {
      expect(copy.notes).to.have.lengthOf(2)
      expect(copy.transcriptions).to.have.lengthOf(2)
      expect(copy.selections).to.have.lengthOf(1)

      let [sel] = copy.selections

      expect(sel).to.include({ photo: copy.photo.id, height: 4 })
      expect(sel.notes).to.have.lengthOf(1)
      expect(sel.transcriptions).to.have.lengthOf(1)

      expect(copy.photo.notes).to.have.lengthOf(1)
      expect(copy.photo.transcriptions).to.have.lengthOf(1)
      expect(copy.photo.selections).to.eql([sel.id])
    })

    it('leaves the original intact', async () => {
      expect((await photo.load(db, [original.id]))[original.id])
        .to.eql(original)
    })
  })

  describe('order', () => {
    let item_
    let photos

    const add = async (parent) =>
      (await photo.create(db, { template: TEMPLATE }, {
        item: parent, data: {}, image: { path: 'p.jpg', checksum: '1', mimetype: 'image/jpeg' }
      })).id

    const ordered = async (id) =>
      (await item.load(db, [id]))[id].photos

    beforeEach(async () => {
      item_ = (await item.create(db, TEMPLATE)).id
      photos = [await add(item_), await add(item_), await add(item_)]
    })

    it('orders photos', async () => {
      let [a, b, c] = photos
      await photo.order(db, item_, [c, a, b])
      expect(await ordered(item_)).to.eql([c, a, b])
    })

    it('treats a null offset as 0', async () => {
      let [a, b, c] = photos
      await photo.order(db, item_, [c, a, b], null)
      expect(await db.all(sql`
        SELECT id, position FROM photos WHERE item_id = ${item_}
          ORDER BY position`)).to.eql([
        { id: c, position: 1 },
        { id: a, position: 2 },
        { id: b, position: 3 }
      ])
    })

    it('keeps the order through delete and restore', async () => {
      let [a, b, c] = photos
      await photo.delete(db, [a])
      await photo.order(db, item_, [c, b])
      expect(await ordered(item_)).to.eql([c, b])

      await photo.restore(db, { ids: [a] })
      await photo.order(db, item_, [c, a, b])
      expect(await ordered(item_)).to.eql([c, a, b])
    })

    it('merges and splits photos', async () => {
      let [a, b, c] = photos
      let other = (await item.create(db, TEMPLATE)).id
      let d = await add(other)
      await photo.order(db, other, [d])

      await photo.merge(db, other, [b, a], 1)
      expect(await ordered(other)).to.eql([d, b, a])
      expect(await ordered(item_)).to.eql([c])

      await photo.split(db, other, [{ id: item_, photos: [a, b] }])
      expect(await ordered(other)).to.eql([d])
      expect((await ordered(item_)).filter(id => id !== c)).to.eql([a, b])
    })

    it('orders selections', async () => {
      let [s1] = original.selections
      let { id: s2 } = await selection.create(db, {
        template: TEMPLATE, photo: original.id, x: 0, y: 0, width: 1, height: 1
      })

      await selection.order(db, original.id, [s2, s1])
      expect((await photo.load(db, [original.id]))[original.id].selections)
        .to.eql([s2, s1])
    })
  })

  describe('rotate', () => {
    it('rotates the image angle', async () => {
      expect(await image.rotate(db, { id: [original.id], by: -180 }))
        .to.eql({ [original.id]: { angle: 270 } })
    })
  })

  // The 'rebuild' command must produce the indices the triggers maintain.
  describe('full-text indices', () => {
    const TITLE = 'http://purl.org/dc/elements/1.1/title'
    const title = (text) => metadata.update(db, {
      id: original.id, data: { [TITLE]: { text, type: TYPE.TEXT } }
    })

    it('stay in step with their content', async () => {
      let [nid] = original.notes
      let [tid] = original.transcriptions

      await note.save(db, { id: nid, state: {}, text: 'edited' })
      await transcription.save(db, { id: tid, text: 'edited' })
      await title('one')
      await title('two')
      await value.prune(db)
      await annotate(db, original.id, 'added')

      await note.delete(db, [nid])
      await note.prune(db)
      await transcription.remove(db, tid)
      await transcription.prune(db)

      await db.check()
    })
  })

  describe('transcriptions prune', () => {
    it('removes failed transcriptions older than since', async () => {
      let { id: old } = await transcription.create(db, { parent: original.id })
      let { id: recent } = await transcription.create(db, { parent: original.id })

      await transcription.save(db, {
        id: old, status: -1, modified: new Date(Date.now() - 2 * 864e5)
      })
      await transcription.save(db, { id: recent, status: -1 })
      await transcription.prune(db)

      expect(await transcription.load(db, [old, recent]))
        .to.have.keys(String(recent))
    })
  })

  describe('dup, deep: false', () => {
    let copy

    beforeEach(async () => {
      copy = await photo.dup(db, original.id, { deep: false })
    })

    it('copies just the photo', () => {
      expect(copy.photo.id).not.to.equal(original.id)

      expect(copy.notes).to.be.empty
      expect(copy.transcriptions).to.be.empty
      expect(copy.selections).to.be.empty

      expect(copy.photo.notes).to.be.empty
      expect(copy.photo.transcriptions).to.be.empty
      expect(copy.photo.selections).to.be.empty
    })
  })
})
