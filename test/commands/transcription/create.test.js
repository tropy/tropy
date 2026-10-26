import { run } from '../../support/saga.js'
import { Create } from '#tropy/commands/transcription/create.js'
import * as slice from '#tropy/slices/transcriptions.js'

describe('Create transcription', () => {
  let db = { transaction () {} }

  let exec = (payload) => run(
    new Create(slice.create({ text: 'Text', ...payload }), { db }).exec(), {
      state: {
        nav: { photo: 1, selection: null },
        photos: { 1: { id: 1 }, 3: { id: 3 } },
        selections: { 2: { id: 2, photo: 3 } }
      },
      mocks: [[db.transaction, () => [{ id: 9, parent: 2 }]]]
    })

  it('creates transcriptions for known parents', () => {
    for (let payload of [{ selection: 2 }, { photo: [1, 3] }, {}]) {
      expect(exec(payload).result).to.have.keys('9')
    }
  })

  it('skips unknown parents', () => {
    for (let payload of [{ photo: 2 }, { photo: [1, 2] }, { selection: 1 }]) {
      expect(exec(payload).result).to.be.null
    }
  })
})
