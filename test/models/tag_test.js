import { mkdbtmp } from '../support/db'

import { project as projectModel, item as itemModel, tag as tagModel } from '../../src/models'


describe('models', async () => {
  describe('tag', () => {
    let db

    mkdbtmp(x => db = x,
      'db_test.sqlite', projectModel.create, { name: 'Test Project' })
    // required to set up database schema
    // TODO is there a better way to do this?

    describe('create', () => {
      it('creates a new tag', async () => {
        await tagModel.create(db, { name: 'testTag' })

        await expect(db.empty()).to.eventually.be.false

        await expect(db.all('select * from tags'))
          .to.eventually.have.lengthOf(1)
      })

      it('creates a tag with color null by default', async () => {
        const { color } = await tagModel.create(db, { name: 'testTag' })
        expect(color).to.be.null
      })

      it('creates a tag with color if specified', async () => {
        const { color } = await tagModel.create(
          db,
          { name: 'testTag', color: 'blue' }
        )
        expect(color).not.to.be.null
      })

      it('throws if try to create tag with duplicate name', async () => {
        let threw = false
        let errorMessage = ''
        const tagName = 'testDuplicate'
        await tagModel.create(db, { name: tagName })

        try {
          await tagModel.create(db, { name: tagName })
        } catch (e) {
          errorMessage = e.message
          threw = true
        }

        expect(threw).to.be.true
        expect(errorMessage).to.contain(
          'SQLITE_CONSTRAINT: UNIQUE constraint failed'
        )

      })
    })

    describe('load', async () => {
      it('returns the tag object if found', async () => {
        const tagName = 'testTag1'
        const { id } = await tagModel.create(db, { name: tagName })

        const tag = (await tagModel.load(db, [id]))[id]

        expect(tag)
          .to.include({ name: tagName, color: null })
          .and.have.a.property('created')
          .that.does.match(
            /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/
          ) // YYYY-MM-DD HH:MM:SS
        expect(tag)
          .to.have.a.property('modified').that.does.equal(tag.created)
      })
      it('returns multiple tags if passed multiple IDs', async () => {
        const tag1 = await tagModel.create(db, { name: 'tag1' })
        const tag2 = await tagModel.create(db, { name: 'tag2', color: 'green' })

        const tags = await tagModel.load(db, [tag1.id, tag2.id])

        expect(Object.keys(tags)).to.have.length(2)
        expect(tags[tag1.id]).to.deep.equal(tag1)
        expect(tags[tag2.id]).to.deep.equal(tag2)
      })

      it('returns empty object if tag with id not found', async () => {
        const tags = await tagModel.load(db, [1000])

        expect(tags).to.be.empty
      })

      it('returns only data for found tags', async () => {
        const tag1 = await tagModel.create(db, { name: 'tag1' })

        const tags = await tagModel.load(db, [1, 1200])

        expect(tags[tag1.id]).to.deep.equal(tag1)
        expect(tags[1200]).to.be.undefined
      })
    })

    describe('save', async () => {

      it('updates data', async () => {
        const tagName = 'testTag1'
        const { id, color } = await tagModel.create(
          db,
          { name: tagName, color: 'red' }
        )

        await tagModel.save(db, { id, color: 'blue' })

        const newTag = (await tagModel.load(db, [id]))[id]
        expect(newTag)
          .to.include({ name: tagName })
          .and.to.have.a.property('color').that.does.not.equal(color)
      })
    })

    describe('delete', async () => {

      it('deletes a single tag', async () => {
        const { id } = await tagModel.create(db, { name: 'tag' })
        await expect(db.all('select * from tags'))
          .to.eventually.have.lengthOf(1)

        await tagModel.delete(db, [id])

        await expect(db.all('select * from tags'))
          .to.eventually.have.lengthOf(0)
        const deletedTag = (await tagModel.load(db, [id]))[id]
        expect(deletedTag).to.be.undefined

      })
      it('deletes multiple tags', async () => {
        const tag1 = await tagModel.create(db, { name: 'tag' })
        const tag2 = await tagModel.create(db, { name: 'tag2' })

        await tagModel.delete(db, [tag1.id, tag2.id])

        await expect(db.all('select * from tags'))
          .to.eventually.have.lengthOf(0)
        const deletedTags = await tagModel.load(db, [tag1.id, tag2.id])
        expect(deletedTags).to.be.empty
      })
      it('deletes only specified tags', async () => {
        const tag1 = await tagModel.create(db, { name: 'tag' })
        const tag2 = await tagModel.create(db, { name: 'tag2' })

        await tagModel.delete(db, [tag1.id])

        const remainingTags = await tagModel.load(db, [tag1.id, tag2.id])
        expect(remainingTags[tag2.id]).to.deep.equal(tag2)
        expect(remainingTags[tag1.id]).to.be.undefined
      })
      it.todo('also deletes taggings for a deleted tag?')
    })

    describe('merge', async () => {
      const [tag1id, tag2id, tag3id] = [1, 2, 3]
      let tag1, tag2, tag3
      let item1, item2

      beforeEach(async function () {
        tag1 = await tagModel.create(
          db, { name: 'tag1', color: 'red', id: tag1id }
        )
        tag2 = await tagModel.create(
          db, { name: 'tag2', color: 'blue', id: tag2id }
        )
        tag3 = await tagModel.create(
          db, { name: 'tag3', color: 'green', id: tag3id }
        )

        item1 = await itemModel.create(db, 'https://tropy.org/v1/templates/generic', {
          'http://purl.org/dc/elements/1.1/title': {
            text: 'item1',
            type: 'http://www.w3.org/2001/XMLSchema#string'
          }
        })
        item2 = await itemModel.create(db, 'https://tropy.org/v1/templates/generic', {
          'http://purl.org/dc/elements/1.1/title': {
            text: 'item2',
            type: 'http://www.w3.org/2001/XMLSchema#string'
          }
        })
        await itemModel.tags.add(db, { id: [item1.id], tag: tag1.id })
        await itemModel.tags.add(db, { id: [item2.id], tag: tag2.id })


      })


      it('merges other tags into first tag', async () => {
        await tagModel.merge(db, [tag1.id, tag2.id])

        const res = await tagModel.load(db, [tag1.id, tag2.id])

        expect(res)
          .to.have.property(tag1.id).which.deep.equals(tag1)
          .to.not.have.property(tag2.id)
      })

      it('merges all other tags into first tag provided', async () => {
        await tagModel.merge(db, [tag3.id, tag2.id, tag1.id])

        const res = await tagModel.load(db, [tag1.id, tag2.id, tag3.id])

        expect(res)
          .to.have.property(tag3.id).which.deep.equals(tag3)
          .to.not.have.property(tag2.id)
        expect(res)
          .to.not.have.property(tag1.id)
      })

      it('updates taggings to first of merged tags', async () => {
        await tagModel.merge(db, [tag1.id, tag2.id])

        const taggings = await db.all('select * from taggings')

        expect(taggings[0].tag_id).to.deep.equal(tag1.id)
        expect(taggings[1].tag_id).to.deep.equal(tag1.id)

      })

      it('succeeds if item has >1 of tags to be merged', async () => {
        await itemModel.tags.add(db, { id: [item2.id], tag: tag1.id })
        await itemModel.tags.add(db, { id: [item1.id], tag: tag2.id })

        await tagModel.merge(db, [tag1.id, tag2.id])

        const taggings = await db.all('select * from taggings')
        expect(taggings[0].tag_id).to.deep.equal(tag1.id)
        expect(taggings[1].tag_id).to.deep.equal(tag1.id)
        expect(Object.keys(taggings).length).to.equal(2)
      })
      it.todo('maintains unaffected taggings')
    })
    describe.todo('items')
  })
})

