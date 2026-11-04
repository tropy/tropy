import { mkprojtmp } from '../support/project.js'
import item from '#tropy/models/item.js'
import metadata from '#tropy/models/metadata.js'
import tag from '#tropy/models/tag.js'
import { TYPE } from '#tropy/constants/index.js'

const TEMPLATE = 'https://tropy.org/v1/templates/generic'
const TITLE = 'http://purl.org/dc/elements/1.1/title'

describe('models/item', () => {
  let tpy = mkprojtmp('item.tpy', { name: 'Items' })

  describe('search', () => {
    let db
    let ids

    beforeEach(async () => {
      db = tpy.current.db
      ids = []

      for (let text of [
        'Letter from O\'Brien, 1990-12-03',
        'foo-bar baz.',
        'Box 3: Folder 12'
      ]) {
        let { id } = await item.create(db, TEMPLATE)
        await metadata.update(db, {
          id,
          data: { [TITLE]: { text, type: TYPE.TEXT } }
        })
        ids.push(id)
      }
    })

    const search = async (query) =>
      (await item.all(db, { query, sort: { column: TITLE, asc: true } }))
        .items

    it('treats user input as terms, not FTS5 syntax', async () => {
      expect(await search('1990-12')).to.eql([ids[0]])
      expect(await search('O\'Brien')).to.eql([ids[0]])
      expect(await search('foo-bar')).to.eql([ids[1]])
      expect(await search('baz.')).to.eql([ids[1]])
      expect(await search('box 3:')).to.eql([ids[2]])
      expect(await search('(OR')).to.eql([])
    })

    it('matches bare terms as prefixes and phrases exactly', async () => {
      expect(await search('lett bri')).to.eql([ids[0]])
      expect(await search('"lett"')).to.eql([])
      expect(await search('"letter from"')).to.eql([ids[0]])
      expect(await search('"from letter"')).to.eql([])
      expect(await search('"folder 1')).to.eql([ids[2]])
    })

    it('matches terms per item, across fields and tags', async () => {
      let { id } = await tag.create(db, { name: 'World_War' })
      await item.tags.add(db, { id: [ids[2]], tag: id })

      expect(await search('box war')).to.eql([ids[2]])
      expect(await search('folder ld_wa')).to.eql([ids[2]])
      expect(await search('box letter')).to.eql([])
      expect(await search('wor_d')).to.eql([])
    })

    it('accepts long queries', async () => {
      let words = Array.from({ length: 600 }, (_, i) => `w${i}`)

      expect(await search('box BOX '.repeat(300))).to.eql([ids[2]])
      expect(await search(words.join(' '))).to.eql([])
    })

    it('seeds all items in case-insensitive order, empty last', async () => {
      let { id } = await item.create(db, TEMPLATE)

      expect(await item.seed(db, { column: TITLE, asc: true }))
        .to.eql([ids[2], ids[1], ids[0], id])
      expect(await item.seed(db, { column: TITLE, asc: false }))
        .to.eql([ids[0], ids[1], ids[2], id])
    })
  })
})
