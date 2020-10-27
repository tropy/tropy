'use strict'

const { join } = require('path')
const { mkdtmp } = require('../support/tmp')
const { writeFile, mkdir, rmdir } = require('fs').promises

describe('directory utils', () => {
  const utils = __require('common/dir')
  const root = join(mkdtmp(), 'dir')

  beforeEach(async () => {
    await mkdir(root)
  })

  afterEach(async () => {
    await rmdir(root, { recursive: true })
  })


  describe('ls', () => {
    const { ls } = utils

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
})
