import { mkprojtmp } from '../support/project.js'
import image from '#tropy/models/image.js'
import item from '#tropy/models/item.js'
import note from '#tropy/models/note.js'
import photo from '#tropy/models/photo.js'
import selection from '#tropy/models/selection.js'
import * as transcription from '#tropy/models/transcription.js'

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

  describe('rotate', () => {
    it('rotates the image angle', async () => {
      expect(await image.rotate(db, { id: [original.id], by: -180 }))
        .to.eql({ [original.id]: { angle: 270 } })
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
