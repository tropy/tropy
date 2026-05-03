import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { AccountService } from '#tropy/main/account.js'

describe('AccountService', () => {
  let app
  let service
  let originalFetch

  beforeEach(() => {
    app = { safe: {}, opts: { auth: 'https://auth.example.com/' } }
    service = new AccountService(app)
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('status', () => {
    it('returns linked: false when no account is stored', () => {
      expect(service.status).to.eql({ linked: false, username: undefined })
    })

    it('returns linked: true when a token is stored', () => {
      app.safe.account = { token: 't-1', username: 'alice' }
      expect(service.status).to.eql({ linked: true, username: 'alice' })
    })

    it('does not expose the token', () => {
      app.safe.account = { token: 't-1', username: 'alice' }
      expect(service.status).not.to.have.property('token')
    })
  })

  describe('link', () => {
    it('stores the token on success', async () => {
      globalThis.fetch = mock.fn(async () => new Response(
        JSON.stringify({ refresh_token: 't-1' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      ))

      let result = await service.link({ username: 'alice', password: 'pw' })

      expect(result).to.eql({ linked: true, username: 'alice' })
      expect(app.safe.account).to.eql({ token: 't-1', username: 'alice' })
    })

    it('throws account.link.<status> on non-ok response', async () => {
      globalThis.fetch = mock.fn(async () => new Response(null, { status: 401 }))

      await assert.rejects(
        service.link({ username: 'alice', password: 'wrong' }),
        { message: 'account.link.401' }
      )
      expect(app.safe.account).to.be.undefined
    })

    it('rethrows when fetch throws', async () => {
      let err = new TypeError('failed to fetch')
      globalThis.fetch = mock.fn(async () => { throw err })

      await assert.rejects(
        service.link({ username: 'alice', password: 'pw' }),
        err
      )
      expect(app.safe.account).to.be.undefined
    })

    it('throws account.link.token-missing when response lacks refresh_token', async () => {
      globalThis.fetch = mock.fn(async () => new Response(
        JSON.stringify({}),
        { status: 200, headers: { 'content-type': 'application/json' } }
      ))

      await assert.rejects(
        service.link({ username: 'alice', password: 'pw' }),
        { message: 'account.link.token-missing' }
      )
      expect(app.safe.account).to.be.undefined
    })

    it('emits change on success and failure', async () => {
      let listener = mock.fn()
      service.on('change', listener)

      globalThis.fetch = mock.fn(async () => new Response(
        JSON.stringify({ refresh_token: 't-1' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      ))
      await service.link({ username: 'alice', password: 'pw' })

      globalThis.fetch = mock.fn(async () => new Response(null, { status: 401 }))
      await service.link({ username: 'alice', password: 'wrong' }).catch(() => {})

      expect(listener.mock.callCount()).to.equal(2)
    })
  })

  describe('unlink', () => {
    it('posts to /unlink and clears the stored account', async () => {
      app.safe.account = { token: 't-1', username: 'alice' }
      let fetchMock = mock.fn(async () => new Response(null, { status: 200 }))
      globalThis.fetch = fetchMock

      let result = await service.unlink()

      expect(result).to.be.true
      expect(app.safe.account).to.be.undefined
      expect(fetchMock.mock.callCount()).to.equal(1)
    })

    it('returns false and skips fetch when no account is linked', async () => {
      let fetchMock = mock.fn()
      globalThis.fetch = fetchMock

      let result = await service.unlink()

      expect(result).to.be.false
      expect(fetchMock.mock.callCount()).to.equal(0)
    })

    it('emits change only when an account was linked', async () => {
      let listener = mock.fn()
      service.on('change', listener)

      await service.unlink()
      expect(listener.mock.callCount()).to.equal(0)

      app.safe.account = { token: 't-1', username: 'alice' }
      globalThis.fetch = mock.fn(async () => new Response(null, { status: 200 }))
      await service.unlink()
      expect(listener.mock.callCount()).to.equal(1)
    })
  })
})
