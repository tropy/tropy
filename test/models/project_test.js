import { mkdbtmp } from '../support/db.js'
import projectModel from '../../src/models/project.js'

describe('models', () => {
  describe('project', () => {
    let db = mkdbtmp(':memory:', projectModel.create, { name: 'Ariadne' })

    describe('create', () => {
      it('creates a fresh project', async () => {

        await expect(db.current.empty()).to.eventually.be.false

        await expect(db.current.all('select * from project'))
          .to.eventually.have.lengthOf(1)

        await expect(db.current.get('select name from project'))
          .to.eventually.have.property('name', 'Ariadne')

        await expect(db.current.version())
          .to.eventually.to.be.a('number').above(1601010000)
      })
    })

    describe('load', () => {
      it('returns the project object', async () => {
        let project = await projectModel.load(db.current)

        expect(project)
          .to.include({ name: 'Ariadne', items: 0 })
          .and.have.a.property('id').that.does.match(/^[\da-f-]+$/)
      })
    })
  })
})
