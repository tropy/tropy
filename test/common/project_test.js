import { stat, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mkprojtmp } from '../support/project.js'
import { mkdtmp } from '../support/tmp.js'
import { create, pstat } from '../../src/common/project.js'

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
      })
    })

    describe('*.tpm', () => {
      let tpm = mkprojtmp('test.tpm', { name: 'Ariadne' })

      it('creates managed project folders and database', async () => {
        let { db, path } = tpm.current

        expect((await stat(path)).isDirectory()).to.be.true
        expect((await stat(join(path, 'tropy.sqlite'))).isFile()).to.be.true
        expect((await stat(join(path, 'assets'))).isDirectory()).to.be.true

        let project = await db.get('select * from project')

        expect(project).to.have.property('name', 'Ariadne')
        expect(project).to.have.property('base', 'project')
        expect(project).to.have.property('store', 'assets')

        expect(project)
          .to.have.property('project_id')
          .and.match(/^[0-9a-f-]+$/)

      })
    })

    it('rejects unknown file extensions', () =>
      expect(create('tropy.db', F.schema('project').path))
        .to.eventually.be.rejectedWith('unknown project file extension'))

    it('rejects if file or directory already exists', async () => {
      let tpy = join(tmp, 'file.tpy')
      let tpm = join(tmp, 'file.tpm')

      await writeFile(tpy, '')
      await mkdir(tpm)

      await expect(create(tpy, F.schema('project').path))
        .to.eventually.be.rejectedWith('project file exists')

      await expect(create(tpm, F.schema('project').path))
        .to.eventually.be.rejectedWith('EEXIST')
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

      it('returns null if file not modifed since', () =>
        expect(pstat(tpy.current.path, Date.now() + 1))
          .to.eventually.be.null)
    })

    describe('*.tpm', () => {
      let tpm = mkprojtmp('test.tpm', { name: 'Ariadne' })

      it('returns project stats', async () => {
        let stats = await pstat(tpm.current.path)

        expect(stats).to.have.property('name', 'Ariadne')
        expect(stats).to.have.property('path', tpm.current.path)
        expect(stats).to.have.property('items', 0)
        expect(stats).to.have.property('photos', 0)
        expect(stats).to.have.property('notes', 0)
      })

      it('returns null if file not modifed since', () =>
        expect(pstat(tpm.current.path, Date.now() + 1))
          .to.eventually.be.null)
    })

    it('rejects files with unknown extensions', () =>
      expect(pstat('test.txt'))
        .to.eventually.be.rejectedWith('unknown project file extension'))

    it('rejects missing files', () =>
      expect(pstat('test.tpy'))
        .to.eventually.be.rejectedWith('ENOENT'))
  })
})
