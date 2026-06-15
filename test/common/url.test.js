import { protocolURL, urlId, RESERVED_IDS } from '#tropy/common/url.js'

describe('url', () => {
  describe('urlId', () => {
    it('derives the id from the file basename', () => {
      expect(urlId('/path/to/My Project.tpy')).to.equal('my-project')
      expect(urlId('/path/to/research.tropy')).to.equal('research')
    })

    it('ignores the directory and extension', () => {
      expect(urlId('/Users/x/Archivo Historico.tpy'))
        .to.equal('archivo-historico')
    })

    it('strips diacritics and collapses separators', () => {
      expect(urlId('/x/Über  Café__notes.tpy')).to.equal('uber-cafe-notes')
    })

    it('falls back to "project" when the basename is empty', () => {
      expect(urlId('')).to.equal('project')
      expect(urlId(null)).to.equal('project')
      expect(urlId('/x/!!!.tpy')).to.equal('project')
    })

    it('disambiguates ids reserved by routes', () => {
      for (let reserved of RESERVED_IDS) {
        expect(urlId(`/x/${reserved}.tpy`)).to.equal(`${reserved}-project`)
      }
    })
  })

  describe('protocolURL', () => {
    it('derives the id from the file basename', () => {
      expect(protocolURL('/path/to/My Project.tpy'))
        .to.equal('tropy://project/my-project/')
    })

    it('builds an item/photo url when both are present', () => {
      expect(protocolURL('/path/to/My Project.tpy', { item: 1, photo: 2 }))
        .to.equal('tropy://project/my-project/items/1/2')
    })

    it('omits the item path when item or photo is missing', () => {
      expect(protocolURL('/path/to/My Project.tpy', { item: 1 }))
        .to.equal('tropy://project/my-project/')
      expect(protocolURL('/path/to/My Project.tpy', { photo: 2 }))
        .to.equal('tropy://project/my-project/')
    })
  })
})
