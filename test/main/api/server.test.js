import { createServer } from 'node:net'
import { Server } from '#tropy/main/api/server.js'

describe('api.Server', () => {
  it('starts, stops and restarts on loopback', async () => {
    let port = await free()
    let api = new Server({
      opts: { port },
      state: { recent: [] },
      version: '1.0.0'
    })

    let status = () =>
      fetch(`http://127.0.0.1:${port}/`).then(res => res.status)

    try {
      await api.start()
      expect(api.status).to.be.true
      expect(await status()).to.equal(200)

      await api.stop()
      expect(api.status).to.be.false

      await api.start()
      expect(await status()).to.equal(200)
    } finally {
      await api.stop()
    }
  })
})

function free () {
  return new Promise((resolve) => {
    let server = createServer().listen(0, '127.0.0.1', () => {
      let { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

describe('api.Server.resolveProject', () => {
  let path = '/projects/My Project.tropy'
  let win = {}

  let api = new Server({
    state: { recent: [path] },
    wm: { values: () => [win] },
    getProject: () => ({ path })
  })

  it('resolves decoded URL ids', () => {
    expect(api.resolveProject('My Project'))
      .to.include({ win, path, id: 'My%20Project' })
  })
})
