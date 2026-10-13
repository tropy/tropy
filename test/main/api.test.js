import { Server } from '#tropy/main/api.js'

describe('api.Server', () => {
  describe('resolveProject', () => {
    let win = {}
    let server = new Server({
      state: { recent: ['/x/Cartografia Histórica.tpy', '/x/foo.tpy'] },
      wm: { current: () => win, values: () => [win] },
      getProject: () => ({ path: '/x/Cartografia Histórica.tpy' }),
      opts: {}
    })

    it('matches decoded ids against encoded urlIds', () => {
      // the router decodes path params before they reach resolveProject
      let { path, id } = server.resolveProject('Cartografia Histórica')

      expect(path).to.equal('/x/Cartografia Histórica.tpy')
      expect(id).to.equal('Cartografia%20Hist%C3%B3rica')
    })

    it('resolves "current" to the focused project window', () => {
      let { path, id } = server.resolveProject('current')

      expect(path).to.equal('/x/Cartografia Histórica.tpy')
      expect(id).to.equal('Cartografia%20Hist%C3%B3rica')
    })

    it('throws 404 for unknown projects', () => {
      expect(() => server.resolveProject('nope'))
        .to.throw()
        .with.property('status', 404)
    })
  })
})
