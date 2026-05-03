import * as manifest from '#tropy/main/actions.js'
import * as actions from '#tropy/actions/index.js'

function *names (obj) {
  for (let val of Object.values(obj)) {
    if (typeof val === 'function') {
      let { name } = val()
      if (typeof name === 'string') yield name
    } else if (val && typeof val === 'object') {
      yield* names(val)
    }
  }
}

describe('main action manifest', () => {
  for (let name of names(manifest)) {
    it(`${name} resolves to a renderer action creator`, () => {
      let fn = name.split('.').reduce((o, k) => o?.[k], actions)
      expect(fn).to.be.a('function')
    })
  }
})
