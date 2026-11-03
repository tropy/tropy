import { ITEM } from '#tropy/constants/index.js'
import { project } from '#tropy/reducers/project.js'

describe('Project Reducer', () => {
  it('is no longer blank after the first item', () => {
    let state = project({ isBlank: true }, { type: ITEM.INSERT, payload: {} })
    expect(state.isBlank).to.be.false
  })
})
