import assert from 'node:assert/strict'
import { stat, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { mkprojtmp } from '../support/project.js'
import { mkdtmp, mktmp } from '../support/tmp.js'
import { convert, create, load, open, pstat } from '#tropy/common/project.js'
import { delay } from '#tropy/common/util.js'

const fixtures = join(import.meta.dirname, '../fixtures')
const appDir = join(fixtures, '../..')
const schema = join(appDir, 'db/schema/project.sql')

describe('common/project', () => {

  describe('create', () => {
    let tmp = mkdtmp()

    describe('*.tpy', () => {
      let tpy = mkprojtmp('test.tpy', { id: 'abc123', name: 'Daedalus' })

      it('creates a project file', async () => {
        let { db, path } = tpy.current

        expect((await stat(path)).isFile()).to.be.true

        let project = await db.get('select * from project')

        expect(project).to.have.property('name', 'Daedalus')
        expect(project).to.have.property('base', null)
        expect(project).to.have.property('store', null)
        expect(project).to.have.property('project_id', 'abc123')

        expect(await db.version()).to.be.a('number').above(1601010000)
      })
    })

    describe('managed', () => {
      let tpm = mkprojtmp('test.tropy', { name: 'Ariadne' })

      it('creates managed project folders and database', async () => {
        let { db, path } = tpm.current

        expect((await stat(path)).isDirectory()).to.be.true
        expect((await stat(join(path, 'project.tpy'))).isFile()).to.be.true
        expect((await stat(join(path, 'assets'))).isDirectory()).to.be.true

        let project = await db.get('select * from project')

        expect(project).to.have.property('name', 'Ariadne')
        expect(project).to.have.property('base', 'project')
        expect(project).to.have.property('store', 'assets')

        expect(project)
          .to.have.property('project_id')
          .and.match(/^[0-9a-f-]+$/)

        expect(await db.version()).to.be.a('number').above(2207140000)
      })
    })

    it('rejects unknown file extensions', async () => {
      await assert.rejects(
        () => create('tropy.db', schema, appDir),
        { message: /unknown project file extension/ })
    })

    it('rejects if file or directory already exists', async () => {
      let tpy = join(tmp, 'file.tpy')
      let tpm = join(tmp, 'file.tropy')

      await writeFile(tpy, '')
      await mkdir(tpm)

      await assert.rejects(
        () => create(tpy, schema, appDir),
        { message: /project file exists/ })

      await assert.rejects(
        () => create(tpm, schema, appDir),
        { message: /project file exists/ })
    })
  })

  describe('load', () => {
    describe('*.tpy', () => {
      let tpy = mkprojtmp('test.tpy', { name: 'Daedalus' })

      it('returns project info', async () => {
        let { db } = tpy.current
        let project = await load(db)

        expect(project.name).to.equal('Daedalus')
        expect(project.base).to.be.null
        expect(project.store).to.be.null
        expect(project.isManaged).to.be.false
      })
    })

    describe('managed', () => {
      let tpm = mkprojtmp('test.tropy', { name: 'Ariadne' })

      it('returns project info', async () => {
        let { db } = tpm.current
        let project = await load(db)

        expect(project.name).to.equal('Ariadne')
        expect(project.base).to.equal('project')
        expect(project.isManaged).to.be.true
        expect(isAbsolute(project.store)).to.be.true
      })
    })
  })

  describe('pstat', () => {
    describe('*.tpy', () => {
      let tpy = mkprojtmp('test.tpy', { name: 'Daedalus' })

      it('returns project stats', async () => {
        let stats = await pstat(tpy.current.path)

        expect(stats).to.have.property('name', 'Daedalus')
        expect(stats).to.have.property('path', tpy.current.path)
        expect(stats).to.have.property('items', 0)
        expect(stats).to.have.property('photos', 0)
        expect(stats).to.have.property('notes', 0)
      })

      it('returns null if file not modified since', async () => {
        await delay(100)
        expect(await pstat(tpy.current.path, Date.now())).to.be.null
      })
    })

    describe('managed', () => {
      let tpm = mkprojtmp('test.tropy', { name: 'Ariadne' })

      it('returns project stats', async () => {
        let stats = await pstat(tpm.current.path)

        expect(stats).to.have.property('name', 'Ariadne')
        expect(stats).to.have.property('path', tpm.current.path)
        expect(stats).to.have.property('items', 0)
        expect(stats).to.have.property('photos', 0)
        expect(stats).to.have.property('notes', 0)
      })

      it('returns null if file not modified since', async () => {
        await delay(100)
        expect(await pstat(tpm.current.path, Date.now())).to.be.null
      })

      it('returns folder path when given database file', async () => {
        let stats = await pstat(join(tpm.current.path, 'project.tpy'))
        expect(stats).to.have.property('path', tpm.current.path)
      })
    })

    it('rejects files with unknown extensions', async () => {
      await assert.rejects(
        () => pstat('test.txt'),
        { message: /unknown project file extension/ })
    })

    it('rejects missing files', async () => {
      await assert.rejects(
        () => pstat('test.tpy'),
        { code: 'ENOENT' })
    })
  })

  describe('convert', () => {
    let tpy = mkprojtmp('a.tpy', { name: 'Daedalus' })
    let tpm = mktmp('b.tropy')

    it('converts *.tpy to *.tropy', async () => {
      await convert(tpy.current.path, tpm, appDir)
      let [db, project] = await open(tpm)

      expect(project.name).to.equal('Daedalus')
      expect(project.base).to.equal('project')
      expect(project.isManaged).to.be.true
      expect(isAbsolute(project.store)).to.be.true

      expect(existsSync(join(tpm, 'project.tpy-wal'))).to.be.ok
      expect(existsSync(join(tpm, '.DirIcon'))).to.be.ok
      expect(existsSync(join(tpm, 'folder.ico'))).to.be.ok
      expect(existsSync(join(tpm, 'desktop.ini'))).to.be.ok

      await db.close()
    })

    it('throws when trying to convert to *.tpy', async () => {
      await assert.rejects(
        () => convert('a.tropy', 'b.tpy'),
        { message: /not implemented/ })
    })

    it('throws when trying to convert to same type', async () => {
      await assert.rejects(
        () => convert('a.tpy', 'b.tpy'),
        { message: /different types/ })
    })

    it('throws when given no source', async () => {
      await assert.rejects(() => convert())
    })

    it('throws when given no target', async () => {
      await assert.rejects(() => convert('test.tpy'))
    })

    it('throws when given target only', async () => {
      await assert.rejects(() => convert(null, 'test.tropy'))
    })

    it('throws when given bad source path', async () => {
      await assert.rejects(() => convert('a.txt'))
    })

    it('throws when given bad target path', async () => {
      await assert.rejects(
        () => convert('a.tpy', 'b.txt'),
        { message: /file extension/ })
    })
  })
})
