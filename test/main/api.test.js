import { Server } from '#tropy/main/api.js'

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
