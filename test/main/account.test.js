import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { AccountService } from '#tropy/main/account.js'

describe('AccountService', () => {
  let app
  let account

  let withResponse = (status = 200, body = {}) =>
    async () => new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' }
    })

  beforeEach(() => {
    app = {
      safe: {},
      state: {
        uuid: 'device'
      },
      opts: { auth: 'https://auth.example.com/' }
    }
    account = new AccountService(app)
    mock.method(globalThis, 'fetch', withResponse(401))
  })

  afterEach(() => {
    globalThis.fetch.mock?.restore()
  })

  describe('status', () => {
    it('returns linked: false without refresh token', () => {
      expect(account.status).to.have.property('linked', false)
    })

    it('returns linked: true with refresh token', () => {
      app.safe.account = { token: 'badc0de' }
      expect(account.status).to.have.property('linked', true)
    })

    it('does not expose the token itself', () => {
      app.safe.account = { token: 'badc0de' }
      expect(account.status).not.to.have.property('token')
    })
  })

  describe('link', () => {
    it('stores the token on success', async () => {
      fetch.mock.mockImplementation(withResponse(200, { refresh_token: 'b4dc0de' }))

      await account.link({ username: 'ariadne', password: 'password' })

      expect(account.status).to.have.property('linked', true)
      expect(app.safe.account).to.have.property('token', 'b4dc0de')
    })

    it('throws code: credentials', async () => {
      fetch.mock.mockImplementation(withResponse(401, { error: 'errno' }))

      await assert.rejects(
        account.link({ username: 'ariadne', password: 'wrong' }),
        { message: 'credentials' }
      )
      expect(app.safe.account).to.be.undefined
    })

    it('rethrows when fetch throws', async () => {
      fetch.mock.mockImplementation(async () => { throw new Error })

      await assert.rejects(
        account.link({ username: 'ariadne', password: 'pw' })
      )
      expect(app.safe.account).to.be.undefined
    })

    it('throws code: token when response lacks refresh_token', async () => {
      fetch.mock.mockImplementation(withResponse(200))

      await assert.rejects(
        account.link({ username: 'ariadne', password: 'pw' }),
        { message: 'token' }
      )
      expect(app.safe.account).to.be.undefined
    })

    it('emits change on success and failure', async () => {
      let listener = mock.fn()
      account.on('change', listener)

      fetch.mock.mockImplementation(withResponse(200, {
        refresh_token: 'abc'
      }))
      await account.link({ username: 'ariadne', password: 'pw' })

      fetch.mock.mockImplementation(withResponse(401))
      await account.link({ username: 'ariadne', password: 'wrong' }).catch(() => {})

      expect(listener.mock.callCount()).to.equal(2)
    })
  })

  describe('unlink', () => {
    it('posts to /unlink and clears the stored account', async () => {
      app.safe.account = { token: 't-1', username: 'ariadne' }
      fetch.mock.mockImplementation(withResponse(200))

      let result = await account.unlink()

      expect(result).to.be.true
      expect(app.safe.account).to.be.undefined
      expect(fetch.mock.callCount()).to.equal(1)
    })

    it('returns false and skips fetch when no account is linked', async () => {
      fetch.mock.mockImplementation(withResponse(200))
      let result = await account.unlink()

      expect(result).to.be.false
      expect(fetch.mock.callCount()).to.equal(0)
    })

    it('emits change only when an account was linked', async () => {
      let listener = mock.fn()
      account.on('change', listener)

      await account.unlink()
      expect(listener.mock.callCount()).to.equal(0)

      app.safe.account = { token: 't-1', username: 'ariadne' }
      fetch.mock.mockImplementation(withResponse(200))
      await account.unlink()
      expect(listener.mock.callCount()).to.equal(1)
    })
  })
})
