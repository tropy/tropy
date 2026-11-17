import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { unzip } from '#tropy/common/zip.js'

describe('unzip', () => {
  let dir

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tropy-zip-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true })
  })

  it('strips a single top-level folder', async () => {
    let dst = join(dir, 'x')
    await unzip(F.join('zip', 'nested.zip'), dst, { strip: true })
    expect(await readdir(dst)).to.eql(['package.json'])
    expect(await readdir(dir)).to.eql(['x'])
  })

  it('keeps flat archives as they are', async () => {
    let dst = join(dir, 'x')
    await unzip(F.join('zip', 'flat.zip'), dst, { strip: true })
    expect((await readdir(dst)).sort()).to.eql(['index.js', 'package.json'])
    expect(await readdir(dir)).to.eql(['x'])
  })

  it('removes the temporary folder on failure', async () => {
    let dst = join(dir, 'x')
    await assert.rejects(unzip(join(dir, 'missing.zip'), dst, { strip: true }))
    expect(await readdir(dir)).to.eql([])
  })

  for (let strip of [false, true]) {
    describe(strip ? 'strip' : 'no strip', () => {
      let dst

      beforeEach(async () => {
        dst = join(dir, 'x')
        await mkdir(dst)
        await writeFile(join(dst, 'old.js'), '')
      })

      it('fails if dst exists', async () => {
        await assert.rejects(unzip(F.join('zip', 'nested.zip'), dst, { strip }))
        expect(await readdir(dst)).to.eql(['old.js'])
        expect(await readdir(dir)).to.eql(['x'])
      })

      it('replaces dst when overwriting', async () => {
        await unzip(F.join('zip', 'flat.zip'), dst, { strip, overwrite: true })
        expect((await readdir(dst)).sort()).to.eql(['index.js', 'package.json'])
        expect(await readdir(dir)).to.eql(['x'])
      })
    })
  }
})
