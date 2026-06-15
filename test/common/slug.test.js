import { protocolURL, sanitizeSlug, RESERVED_SLUGS } from '#tropy/common/slug.js'

describe('slug', () => {
  describe('sanitizeSlug', () => {
    it('lowercases and replaces whitespace', () => {
      expect(sanitizeSlug('My Project')).to.equal('my-project')
    })

    it('strips diacritics', () => {
      expect(sanitizeSlug('Pesquisa Histórica')).to.equal('pesquisa-historica')
      expect(sanitizeSlug('Über Café')).to.equal('uber-cafe')
    })

    it('replaces non-alphanumerics and collapses dashes', () => {
      expect(sanitizeSlug('a/b & c__d')).to.equal('a-b-c-d')
    })

    it('trims leading and trailing dashes', () => {
      expect(sanitizeSlug('  --hello--  ')).to.equal('hello')
    })

    it('falls back to "project" when empty', () => {
      expect(sanitizeSlug('')).to.equal('project')
      expect(sanitizeSlug('   ')).to.equal('project')
      expect(sanitizeSlug('!!!')).to.equal('project')
      expect(sanitizeSlug(null)).to.equal('project')
      expect(sanitizeSlug(undefined)).to.equal('project')
    })

    it('disambiguates reserved slugs', () => {
      for (let reserved of RESERVED_SLUGS) {
        expect(sanitizeSlug(reserved)).to.equal(`${reserved}-project`)
      }
    })
  })

  describe('protocolURL', () => {
    it('derives the slug from the name', () => {
      expect(protocolURL('My Project'))
        .to.equal('tropy://project/my-project/')
    })

    it('builds an item/photo url when both are present', () => {
      expect(protocolURL('My Project', { item: 1, photo: 2 }))
        .to.equal('tropy://project/my-project/items/1/2')
    })

    it('omits the item path when item or photo is missing', () => {
      expect(protocolURL('My Project', { item: 1 }))
        .to.equal('tropy://project/my-project/')
      expect(protocolURL('My Project', { photo: 2 }))
        .to.equal('tropy://project/my-project/')
    })
  })
})
