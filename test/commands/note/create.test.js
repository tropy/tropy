import { run } from '../../support/saga.js'
import { Create } from '#tropy/commands/note/create.js'
import * as act from '#tropy/actions/index.js'

describe('Create note', () => {
  let db = { transaction () {} }

  let exec = (payload) => run(
    new Create(act.note.create({ html: '<p>Note</p>', ...payload }), { db })
      .exec(), {
      state: {
        nav: { photo: 1, selection: null },
        photos: { 1: { id: 1 }, 3: { id: 3 } },
        selections: { 2: { id: 2, photo: 3 } }
      },
      mocks: [[db.transaction, () => ({ id: 9 })]]
    })

  it('adds the note to the given selection', () => {
    let [add] = exec({ selection: 2 }).puts
    expect(add.payload).to.eql({ id: 2, notes: [9] })
  })

  it('falls back to the current photo without a parent', () => {
    let [add] = exec({}).puts
    expect(add.payload).to.eql({ id: 1, notes: [9] })
  })

  it('skips unknown parents', () => {
    for (let payload of [{ photo: 2 }, { selection: 1 }]) {
      expect(exec(payload).result).to.be.null
    }
  })
})
