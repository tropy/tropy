import { Server } from '#tropy/main/api/server.js'

describe('api.Server', () => {
  let mkserver = () => new Server({
    opts: { port: 0 },
    state: { recent: [] }
  })

  let status = (port) =>
    fetch(`http://127.0.0.1:${port}/`).then(res => res.status)

  it('starts, stops and restarts on loopback', async () => {
    let api = mkserver()

    try {
      await api.start()
      let { port } = await api.address()

      expect(port).to.be.above(0)
      expect(await status(port)).to.equal(200)

      await api.stop()
      expect(api.status).to.be.false

      api.app.opts.port = port
      await api.start()
      expect(await status(port)).to.equal(200)
    } finally {
      await api.stop()
    }
  })

  it('stops a pending start', async () => {
    let api = mkserver()
    let started = api.start()

    await api.stop()

    expect(api.status).to.be.false
    expect((await started).server.listening).to.be.false
  })
})
