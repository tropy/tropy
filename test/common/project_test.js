import { stat, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { mkprojtmp } from '../support/project.js'
import { mkdtmp, mktmp } from '../support/tmp.js'
import { convert, create, load, open, pstat } from '../../src/common/project.js'
import { delay } from '../../src/common/util.js'

describe('common/project', () => {

  describe('create', () => { // Used by mkprojtmp under the hood!
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

    it('rejects unknown file extensions', () =>
      expect(create('tropy.db', F.schema('project').path))
        .to.eventually.be.rejectedWith('unknown project file extension'))

    it('rejects if file or directory already exists', async () => {
      let tpy = join(tmp, 'file.tpy')
      let tpm = join(tmp, 'file.tropy')

      await writeFile(tpy, '')
      await mkdir(tpm)

      await expect(create(tpy, F.schema('project').path))
        .to.eventually.be.rejectedWith('project file exists')

      await expect(create(tpm, F.schema('project').path))
        .to.eventually.be.rejectedWith('project file exists')
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

      // TODO populate db

      it('returns project stats', async () => {
        let stats = await pstat(tpy.current.path)

        expect(stats).to.have.property('name', 'Daedalus')
        expect(stats).to.have.property('path', tpy.current.path)
        expect(stats).to.have.property('items', 0)
        expect(stats).to.have.property('photos', 0)
        expect(stats).to.have.property('notes', 0)
      })

      it('returns null if file not modifed since', async () => {
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

      it('returns null if file not modifed since', async () => {
        await delay(100)
        expect(await pstat(tpm.current.path, Date.now())).to.be.null
      })

      it('returns folder path when given database file', async () => {
        let stats = await pstat(join(tpm.current.path, 'project.tpy'))
        expect(stats).to.have.property('path', tpm.current.path)
      })
    })

    it('rejects files with unknown extensions', () =>
      expect(pstat('test.txt'))
        .to.eventually.be.rejectedWith('unknown project file extension'))

    it('rejects missing files', () =>
      expect(pstat('test.tpy'))
        .to.eventually.be.rejectedWith('ENOENT'))
  })

  describe('convert', () => {
    let tpy = mkprojtmp('a.tpy', { name: 'Daedalus' })
    let tpm = mktmp('b.tropy')

    it('converts *.tpy to *.tropy', async () => {

      // TODO add photos

      await convert(tpy.current.path, tpm)
      let [db, project] = await open(tpm)

      expect(project.name).to.equal('Daedalus')
      expect(project.base).to.equal('project')
      expect(project.isManaged).to.be.true
      expect(isAbsolute(project.store)).to.be.true

      expect(existsSync(join(tpm, 'project.tpy-wal'))).to.be.ok

      // TODO check store
      // TODO check photo paths

      await db.close()
    })

    it('throws when trying to convert to *.tpy', () =>
      expect(convert('a.tropy', 'b.tpy'))
        .to.eventually.be.rejectedWith('not implemented'))

    it('throws when trying to convert to same type', () =>
      expect(convert('a.tpy', 'b.tpy'))
        .to.eventually.be.rejectedWith('different types'))

    it('throws when given no source', () =>
      expect(convert())
        .to.eventually.be.rejectedWith('type string'))

    it('throws when given no target', () =>
      expect(convert('test.tpy'))
        .to.eventually.be.rejectedWith('type string'))

    it('throws when given target only', () =>
      expect(convert(null, 'test.tropy'))
        .to.eventually.be.rejectedWith('type string'))

    it('throws when given bad source path', () =>
      expect(convert('a.txt'))
        .to.eventually.be.rejectedWith('type string'))

    it('throws when given bad target path', () =>
      expect(convert('a.tpy', 'b.txt'))
        .to.eventually.be.rejectedWith('file extension'))

  })
})
