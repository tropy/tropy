import { ITEM, PROJECT } from '#tropy/constants/index.js'
import { project } from '#tropy/reducers/project.js'

describe('Project Reducer', () => {
  it('is no longer blank after the first item', () => {
    let state = project({ isBlank: true }, { type: ITEM.INSERT, payload: {} })
    expect(state.isBlank).to.be.false
  })

  it('stays ready when the project info reloads', () => {
    let state = project({ isReady: true }, {
      type: PROJECT.RELOAD,
      payload: { name: 'Atlas' },
      meta: { done: true }
    })

    expect(state).to.include({ name: 'Atlas', isReady: true })
  })
})
