import { run } from '../../support/saga.js'
import { Rotate } from '#tropy/commands/photo/rotate.js'
import * as mod from '#tropy/models/index.js'
import * as act from '#tropy/actions/index.js'

describe('Rotate photo', () => {
  let exec = (payload) => run(
    new Rotate(act.photo.rotate({ by: 90, ...payload }), { db: {} })
      .exec(), {
      state: {
        photos: { 1: { id: 1 } },
        selections: { 2: { id: 2, photo: 1 } }
      },
      mocks: [[mod.image.rotate, (_, { id }) =>
        Object.fromEntries(id.map(i => [i, { angle: 90 }]))]]
    })

  it('rotates photos and selections', () => {
    expect(exec({ id: 1 }).puts[0])
      .to.include({ type: act.photo.bulk.update({}).type })
    expect(exec({ id: 2, type: 'selection' }).puts[0])
      .to.include({ type: act.selection.bulk.update({}).type })
  })

  it('skips images of another type', () => {
    expect(exec({ id: 2 }).result).to.be.null
    expect(exec({ id: 1, type: 'selection' }).result).to.be.null
  })
})
