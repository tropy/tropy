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

  it('adds each warning once', () => {
    let warn = (state) =>
      project(state, { type: PROJECT.WARN, payload: 'corrupted' })

    expect(warn({}).warnings).to.eql(['corrupted'])
    expect(warn({ warnings: ['newer'] }).warnings)
      .to.eql(['newer', 'corrupted'])

    let state = { warnings: ['corrupted'] }
    expect(warn(state)).to.equal(state)
  })
})
