import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdtmp } from '../support/tmp.js'
import { ls, sanitize } from '#tropy/common/fs.js'

describe('fs utils', () => {
  const root = join(mkdtmp(), 'dir')

  beforeEach(async () => {
    await mkdir(root)
  })

  afterEach(async () => {
    await rm(root, { recursive: true })
  })

  describe('ls', () => {
    it('lists files in a directory (recursively)', async () => {
      expect(await ls(root)).to.be.empty

      await writeFile(join(root, 'a.txt'), '')
      await writeFile(join(root, 'README'), '')

      expect(await ls(root)).to.have.length(2)

      let sub1 = join(root, 'foo')
      let sub2 = join(root, 'bar')

      await mkdir(sub1)
      await mkdir(sub2)
      await writeFile(join(sub1, 'bar.bz'), '')
      await writeFile(join(sub2, 'bar.bz'), '')

      expect(await ls(root)).to.have.length(2)
      expect(await ls(sub1)).to.have.length(1)
      expect(await ls(sub2)).to.have.length(1)

      expect(await ls(root, { recursive: true }))
        .to.have.length(4)

      expect(
        await ls(root, {
          recursive: true,
          filter: ({ name }) => name === 'bar.bz'
        })
      ).to.have.length(2)
    })
  })

  describe('sanitize', () => {
    it('appends the extension', () => {
      expect(sanitize('Letters', 'ttp')).to.equal('Letters.ttp')
      expect(sanitize('Letters')).to.equal('Letters')
    })

    it('replaces illegal characters', () => {
      expect(sanitize('1850/1860: a\\b?', 'jpg'))
        .to.equal('1850-1860- a-b-.jpg')
      expect(sanitize('a\tb\u0000c\u0085')).to.equal('a-b-c-')
    })

    it('trims dots and spaces', () => {
      expect(sanitize(' .hidden. ', 'tpy')).to.equal('hidden.tpy')
    })

    it('uses fallback for empty or reserved names', () => {
      expect(sanitize('', 'tropy', 'Project')).to.equal('Project.tropy')
      expect(sanitize(null, 'tropy', 'Project')).to.equal('Project.tropy')
      expect(sanitize('..', 'tropy', 'Project')).to.equal('Project.tropy')
      expect(sanitize('con', 'ttp', 'Template')).to.equal('Template.ttp')
      expect(sanitize('LPT1.txt', 'ttp', 'T')).to.equal('T.ttp')
      expect(sanitize('console', 'ttp')).to.equal('console.ttp')
    })

    it('returns empty string without usable name or fallback', () => {
      expect(sanitize('', 'ttp')).to.equal('')
      expect(sanitize('...', 'ttp')).to.equal('')
    })

    it('truncates long names keeping the extension', () => {
      expect(sanitize('a'.repeat(300), 'jpeg'))
        .to.equal(`${'a'.repeat(80)}.jpeg`)
      expect(sanitize('漢'.repeat(300), 'jpg'))
        .to.equal(`${'漢'.repeat(80)}.jpg`)
    })

    it('replaces surrogate pairs split by truncation', () => {
      expect(sanitize(`${'a'.repeat(79)}😀`))
        .to.equal(`${'a'.repeat(79)}\ufffd`)
    })

    it('replaces lone surrogates', () => {
      expect(sanitize('a\ud800b')).to.equal('a\ufffdb')
    })
  })
})

