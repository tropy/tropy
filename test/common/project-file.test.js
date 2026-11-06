import { join, resolve } from 'node:path'
import { dbPath, projectPath, protocolURL, urlId } from '#tropy/common/project-file.js'

describe('project-file', () => {
  describe('dbPath', () => {
    it('maps a managed project folder to its database', () => {
      expect(dbPath('/x/A.tropy')).to.equal(join('/x/A.tropy', 'project.tpy'))
      expect(dbPath('/x/b.tpy')).to.equal('/x/b.tpy')
    })
  })

  describe('projectPath', () => {
    it('maps the database of a managed project to its folder', () => {
      expect(projectPath('/x/A.tropy/project.tpy')).to.equal(resolve('/x/A.tropy'))
      expect(projectPath('/x/A.tropy')).to.equal(resolve('/x/A.tropy'))
      expect(projectPath('/x/b/project.tpy')).to.equal(resolve('/x/b/project.tpy'))
      expect(projectPath('/x/b.tpy')).to.equal(resolve('/x/b.tpy'))
    })

    it('resolves relative paths', () => {
      expect(projectPath('A.tropy/project.tpy')).to.equal(resolve('A.tropy'))
      expect(projectPath('/x/../b.tpy')).to.equal(resolve('/b.tpy'))
    })

    it('ids a managed project by its folder', () => {
      expect(urlId('/x/A.tropy/project.tpy')).to.equal('A')
    })
  })

  describe('urlId', () => {
    it('derives the id from the file basename', () => {
      expect(urlId('/path/to/My Project.tpy')).to.equal('My Project')
      expect(urlId('/path/to/research.tropy')).to.equal('research')
    })

    it('ignores the directory and extension', () => {
      expect(urlId('/Users/x/Archivo Historico.tpy'))
        .to.equal('Archivo Historico')
    })

    it('keeps non-latin names distinct', () => {
      expect(urlId('/x/עברית.tpy')).to.not.equal(urlId('/x/研究.tpy'))
    })

    it('normalizes unicode composition', () => {
      // NFD (as stored by APFS/HFS+) and NFC must yield the same id
      expect(urlId('/x/Krako\u0301w.tpy')).to.equal('Krak\u00f3w')
      expect(urlId('/x/Krak\u00f3w.tpy')).to.equal('Krak\u00f3w')
    })

    it('does not throw on malformed utf-16 in filenames', () => {
      // NTFS allows unpaired surrogates; encodeURIComponent throws on them
      expect(urlId('/x/notes\uD800.tpy')).to.equal('notes\uFFFD')
    })

    it('returns an empty id when there is no path', () => {
      expect(urlId('')).to.equal('')
      expect(urlId(null)).to.equal('')
    })
  })

  describe('protocolURL', () => {
    it('derives the id from the file basename', () => {
      expect(protocolURL('/path/to/My Project.tpy'))
        .to.equal('tropy://project/My%20Project')
    })

    it('percent-encodes unsafe characters', () => {
      expect(protocolURL('/x/Über Café.tpy'))
        .to.equal('tropy://project/%C3%9Cber%20Caf%C3%A9')
      expect(protocolURL('/x/50%.tpy')).to.equal('tropy://project/50%25')
      expect(protocolURL('/x/a&b.tpy')).to.equal('tropy://project/a%26b')
    })

    it('builds item, photo and selection urls', () => {
      let path = '/path/to/My Project.tpy'

      expect(protocolURL(path, { item: 1 }))
        .to.equal('tropy://project/My%20Project/items/1')
      expect(protocolURL(path, { item: 1, photo: 2 }))
        .to.equal('tropy://project/My%20Project/items/1/2')
      expect(protocolURL(path, { item: 1, photo: 2, selection: 3 }))
        .to.equal('tropy://project/My%20Project/items/1/2/3')
    })

    it('omits segments that follow a missing one', () => {
      expect(protocolURL('/path/to/My Project.tpy', { photo: 2 }))
        .to.equal('tropy://project/My%20Project')
    })

    it('round-trips through the WHATWG URL parser', () => {
      // ids must survive URL parsing so the protocol handler can
      // match them (decoded) against urlId() of recent project paths
      for (let name of ['My Project', '研究', 'Kraków', '50%']) {
        let url = new URL(protocolURL(`/x/${name}.tpy`))
        let [, id] = url.pathname.split('/')
        expect(decodeURIComponent(id)).to.equal(urlId(`/x/${name}.tpy`))
      }
    })
  })
})
