import { protocolURL, urlId } from '#tropy/common/url.js'

describe('url', () => {
  describe('urlId', () => {
    it('derives the id from the file basename', () => {
      expect(urlId('/path/to/My Project.tpy')).to.equal('My%20Project')
      expect(urlId('/path/to/research.tropy')).to.equal('research')
    })

    it('ignores the directory and extension', () => {
      expect(urlId('/Users/x/Archivo Historico.tpy'))
        .to.equal('Archivo%20Historico')
    })

    it('percent-encodes unsafe characters', () => {
      expect(urlId('/x/Über Café.tpy')).to.equal('%C3%9Cber%20Caf%C3%A9')
      expect(urlId('/x/50%.tpy')).to.equal('50%25')
      expect(urlId('/x/a&b.tpy')).to.equal('a%26b')
    })

    it('keeps non-latin names distinct', () => {
      expect(urlId('/x/עברית.tpy')).to.not.equal(urlId('/x/研究.tpy'))
      expect(urlId('/x/עברית.tpy')).to.equal('%D7%A2%D7%91%D7%A8%D7%99%D7%AA')
      expect(urlId('/x/研究.tpy')).to.equal('%E7%A0%94%E7%A9%B6')
    })

    it('normalizes unicode composition', () => {
      // NFD (as stored by APFS/HFS+) and NFC must yield the same id
      expect(urlId('/x/Krako\u0301w.tpy')).to.equal('Krak%C3%B3w')
      expect(urlId('/x/Krak\u00f3w.tpy')).to.equal('Krak%C3%B3w')
    })

    it('does not throw on malformed utf-16 in filenames', () => {
      // NTFS allows unpaired surrogates; encodeURIComponent alone throws
      expect(urlId('/x/notes\uD800.tpy')).to.equal('notes%EF%BF%BD')
    })

    it('returns an empty id when there is no path', () => {
      expect(urlId('')).to.equal('')
      expect(urlId(null)).to.equal('')
    })
  })

  describe('protocolURL', () => {
    it('derives the id from the file basename', () => {
      expect(protocolURL('/path/to/My Project.tpy'))
        .to.equal('tropy://project/My%20Project/')
    })

    it('builds an item/photo url when both are present', () => {
      expect(protocolURL('/path/to/My Project.tpy', { item: 1, photo: 2 }))
        .to.equal('tropy://project/My%20Project/items/1/2')
    })

    it('omits the item path when item or photo is missing', () => {
      expect(protocolURL('/path/to/My Project.tpy', { item: 1 }))
        .to.equal('tropy://project/My%20Project/')
      expect(protocolURL('/path/to/My Project.tpy', { photo: 2 }))
        .to.equal('tropy://project/My%20Project/')
    })

    it('round-trips through the WHATWG URL parser', () => {
      // ids must survive URL parsing so the protocol handler can
      // match them against urlId() of recent project paths
      for (let name of ['My Project', '研究', 'Kraków', '50%']) {
        let url = new URL(protocolURL(`/x/${name}.tpy`))
        let [, id] = url.pathname.split('/')
        expect(id).to.equal(urlId(`/x/${name}.tpy`))
      }
    })
  })
})
