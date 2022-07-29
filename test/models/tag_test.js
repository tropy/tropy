import { mkdbtmp } from '../support/db.js'
import * as mod from '../../src/models/index.js'
import { delay } from '../../src/common/util.js'


describe('tag model', () => {
  let db = mkdbtmp('test.tpy', mod.project.create, { name: 'Test Project' })

  describe('create', () => {
    it('creates a new tag', async () => {
      await mod.tag.create(db.current, { name: 'testTag' })

      await expect(db.current.empty()).to.eventually.be.false

      await expect(db.current.all('select * from tags'))
        .to.eventually.have.lengthOf(1)
    })

    it('creates a tag with color null by default', () =>
      expect(mod.tag.create(db.current, { name: 'test' }))
        .to.eventually.have.property('color', null))

    it('creates a tag with color if specified', () =>
      expect(
        mod.tag.create(db.current, { name: 'test', color: 'blue' })
      ).to.eventually.have.property('color', 'blue'))

    it('throws if try to create tag with duplicate name', async () => {
      let name = 'duplicate'

      await expect(mod.tag.create(db.current, { name }))
        .to.eventually.be.fulfilled

      await expect(mod.tag.create(db.current, { name }))
        .to.eventually.be.rejectedWith('UNIQUE constraint failed')
    })
  })

  describe('load', async () => {
    it('returns the tag object if found', async () => {
      let name = 'testTag1'
      let { id } = await mod.tag.create(db.current, { name })

      let tag = (await mod.tag.load(db.current, [id]))[id]

      expect(tag)
        .to.include({ name, color: null })
        .and.have.a.property('created')
        .that.matches(/^[0-9:\s-]+$/)

      expect(tag).to.have.a.property('modified')
        .that.does.equal(tag.created)
    })

    it('returns multiple tags if passed multiple IDs', async () => {
      let tag1 = await mod.tag.create(db.current, {
        name: 'tag1'
      })

      let tag2 = await mod.tag.create(db.current, {
        name: 'tag2',
        color: 'green'
      })

      let tags = await mod.tag.load(db.current, [tag1.id, tag2.id])

      expect(Object.keys(tags)).to.have.length(2)
      expect(tags[tag1.id]).to.deep.equal(tag1)
      expect(tags[tag2.id]).to.deep.equal(tag2)
    })

    it('returns empty object if tag with id not found', () =>
      expect(mod.tag.load(db.current, [1000])).to.eventually.be.empty)

    it('returns only data for found tags', async () => {
      let tag1 = await mod.tag.create(db.current, { name: 'tag1' })
      let tags = await mod.tag.load(db.current, [1, 1200])

      expect(tags[tag1.id]).to.deep.equal(tag1)
      expect(tags[1200]).to.be.undefined
    })
  })

  describe('save', async () => {
    let original

    beforeEach(async () => {
      original = await mod.tag.create(db.current, {
        name: 'test', color: 'red'
      })
    })

    it('updates data and modified timestamp', async () => {
      let id = original.id
      await delay(1000) // delay 1 sec to ensure modified timestamp differs!
      await mod.tag.save(db.current, { id, color: 'blue' })
      let tag = (await mod.tag.load(db.current, [id]))[id]

      expect(tag.name).to.equal(original.name)
      expect(tag.color).not.to.equal(original.color)
      expect(tag.created).not.to.equal(tag.modified)
      expect(tag.modified).not.to.equal(original.modified)
    })
  })

  describe('delete', async () => {

    it('deletes a single tag', async () => {
      let { id } = await mod.tag.create(db.current, { name: 'tag' })

      await expect(db.current.get('select count(*) as count from tags'))
        .to.eventually.have.property('count', 1)

      await mod.tag.delete(db.current, [id])

      await expect(db.current.get('select count(*) as count from tags'))
        .to.eventually.have.property('count', 0)
    })

    it('deletes multiple tags', async () => {
      let tag1 = await mod.tag.create(db.current, { name: 'tag1' })
      let tag2 = await mod.tag.create(db.current, { name: 'tag2' })

      await expect(db.current.get('select count(*) as count from tags'))
        .to.eventually.have.property('count', 2)

      await mod.tag.delete(db.current, [tag1.id, tag2.id])

      await expect(db.current.get('select count(*) as count from tags'))
        .to.eventually.have.property('count', 0)
    })

    it('deletes only specified tags', async () => {
      let tag1 = await mod.tag.create(db.current, { name: 'tag1' })
      let tag2 = await mod.tag.create(db.current, { name: 'tag2' })

      await mod.tag.delete(db.current, [tag1.id])

      let remainingTags = await mod.tag.load(db.current, [tag1.id, tag2.id])

      expect(remainingTags[tag2.id]).to.deep.equal(tag2)
      expect(remainingTags[tag1.id]).to.be.undefined
    })

    it.todo('also deletes taggings for a deleted tag?')
  })

  describe('merge', async () => {
    let [tag1id, tag2id, tag3id] = [1, 2, 3]
    let tag1, tag2, tag3
    let item1, item2

    beforeEach(async function () {
      tag1 = await mod.tag.create(
        db.current, { name: 'tag1', color: 'red', id: tag1id }
      )
      tag2 = await mod.tag.create(
        db.current, { name: 'tag2', color: 'blue', id: tag2id }
      )
      tag3 = await mod.tag.create(
        db.current, { name: 'tag3', color: 'green', id: tag3id }
      )

      item1 = await mod.item.create(db.current,
        'https://tropy.org/v1/templates/generic',
        {
          'http://purl.org/dc/elements/1.1/title': {
            text: 'item1',
            type: 'http://www.w3.org/2001/XMLSchema#string'
          }
        })
      item2 = await mod.item.create(db.current,
        'https://tropy.org/v1/templates/generic',
        {
          'http://purl.org/dc/elements/1.1/title': {
            text: 'item2',
            type: 'http://www.w3.org/2001/XMLSchema#string'
          }
        })

      await mod.item.tags.add(db.current, { id: [item1.id], tag: tag1.id })
      await mod.item.tags.add(db.current, { id: [item2.id], tag: tag2.id })
    })


    it('merges other tags into first tag', async () => {
      await mod.tag.merge(db.current, [tag1.id, tag2.id])

      let res = await mod.tag.load(db.current, [tag1.id, tag2.id])

      expect(res)
        .to.have.property(tag1.id).which.deep.equals(tag1)
        .to.not.have.property(tag2.id)
    })

    it('merges all other tags into first tag provided', async () => {
      await mod.tag.merge(db.current, [tag3.id, tag2.id, tag1.id])

      let res = await mod.tag.load(db.current, [tag1.id, tag2.id, tag3.id])

      expect(res)
        .to.have.property(tag3.id).which.deep.equals(tag3)
        .to.not.have.property(tag2.id)
      expect(res)
        .to.not.have.property(tag1.id)
    })

    it('updates taggings to first of merged tags', async () => {
      await mod.tag.merge(db.current, [tag1.id, tag2.id])

      let taggings = await db.current.all('select * from taggings')

      expect(taggings[0].tag_id).to.deep.equal(tag1.id)
      expect(taggings[1].tag_id).to.deep.equal(tag1.id)

    })

    it('succeeds if item has >1 of tags to be merged', async () => {
      await mod.item.tags.add(db.current, { id: [item2.id], tag: tag1.id })
      await mod.item.tags.add(db.current, { id: [item1.id], tag: tag2.id })

      await mod.tag.merge(db.current, [tag1.id, tag2.id])

      let taggings = await db.current.all('select * from taggings')
      expect(taggings[0].tag_id).to.deep.equal(tag1.id)
      expect(taggings[1].tag_id).to.deep.equal(tag1.id)
      expect(Object.keys(taggings).length).to.equal(2)
    })

    it.todo('maintains unaffected taggings')

  })

  describe.skip('items')
})
