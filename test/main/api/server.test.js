import { Server } from '#tropy/main/api/server.js'

describe('api.Server', () => {
  it('listens on loopback only', async () => {
    let api = new Server({})
    let server = await api.listen(0, () => {})

    try {
      expect(server.address()).to.have.property('address', '127.0.0.1')
    } finally {
      await api.close(server)
    }
  })
})

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
