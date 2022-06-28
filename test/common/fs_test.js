import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdtmp } from '../support/tmp.js'
import { ls } from '../../src/common/dir.js'

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
})
