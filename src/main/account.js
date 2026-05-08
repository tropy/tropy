import { EventEmitter } from 'node:events'
import { URL } from 'node:url'
import { createRemoteJWKSet } from 'jose/jwks/remote'
import { jwtVerify } from 'jose/jwt/verify'
import { AccountError } from '../common/error.js'
import { debug, info, warn } from '../common/log.js'
import { TokenSet } from '../common/token-set.js'
import { ipcActionHandler } from './ipc.js'


export class AccountService extends EventEmitter {
  #removeIpcHandler
  clientId = 'tropy'

  constructor (app) {
    super()
    this.app = app
    this.jwks = createRemoteJWKSet(this.url('/.well-known/jwks.json'))
  }

  start () {
    this.#removeIpcHandler =
      ipcActionHandler('account', (_, cmd, ...args) => {
        switch (cmd) {
          case 'link':
            return this.link(...args)
          case 'status':
            return this.status
          case 'unlink':
            return this.unlink(...args)
          case 'accessToken':
            return this.accessToken(...args)
          case 'profile':
            return this.profile(...args)
          default:
            throw new Error(`unsupported account command "${cmd}"`)
        }
      })
  }

  stop () {
    this.#removeIpcHandler?.()
  }

  url (pathname = '/') {
    return new URL(pathname, this.app.opts.auth)
  }

  async post (pathname, body, {
    headers = {},
    signal = AbortSignal.timeout(10_000),
    ...opts
  } = {}) {
    try {
      let res
      var url = this.url(pathname)

      if (body) {
        body = JSON.stringify(body)
        headers = {
          ...headers,
          'content-type': 'application/json'
        }
      }

      debug({ url, headers }, 'account: accessing auth server...')

      res = await fetch(url, {
        ...opts,
        method: 'POST',
        body,
        headers: {
          ...headers,
          accept: 'application/json'
        },
        signal
      })

      if (!res.ok) {
        warn({
          body: await res.text().catch(() => null),
          status: res.status,
          url: res.url
        }, `account: response ${res.status} ${res.statusText}`)
      } else {
        debug({
          status: res.status,
          url: res.url
        }, `account: response ${res.status} ${res.statusText}`)
      }

      return res

    } catch (err) {
      warn({ err, url }, 'account: request failed')
      throw new AccountError('network', 'request failed', { cause: err })
    }
  }

  get status () {
    let { account } = this.app.safe

    return {
      connected: !!this.tokenSet?.fresh,
      linked: account?.token != null,
      username: account?.username
    }
  }

  async link ({ username, password }) {
    try {
      let res = await this.post('/link', {
        username,
        password,
        device_id: this.app.state.uuid,
        client_id: this.clientId
      })

      if (res.status === 401) {
        throw new AccountError('credentials')
      }

      if (!res.ok) {
        throw new AccountError(res.status, res.statusText)
      }

      let token = (await res.json()).refresh_token

      if (!token) {
        throw new AccountError('token')
      }

      this.app.safe.account = {
        token,
        username
      }

      info(`account: linked to ${username}`)
      return this.status

    } catch (err) {
      warn({ err }, `account: failed to link account ${username}`)
      delete this.app.safe.account
      delete this.tokenSet
      throw err
    } finally {
      this.emit('change')
    }
  }

  async unlink () {
    let { account } = this.app.safe

    delete this.app.safe.account
    delete this.tokenSet

    try {
      if (account?.token) {
        return (await this.post('/revoke', {
          token: account.token,
          client_id: this.clientId
        })).ok
      }

      return false

    } finally {
      if (account != null) {
        this.emit('change')
      }
    }
  }

  async refresh () {
    let { account } = this.app.safe

    if (!account?.token) {
      throw new AccountError('token')
    }

    let res = await this.post('/token', {
      grant_type: 'refresh_token',
      refresh_token: account.token
    })

    // TODO if the refresh token is bad, unlink account

    if (!res.ok) {
      throw new AccountError(res.status, res.statusText)
    }

    this.tokenSet = new TokenSet(await res.json())
    this.emit('refresh')
  }

  async accessToken () {
    if (!this.tokenSet?.fresh)
      await this.refresh()

    return this.tokenSet.accessToken
  }

  async profile () {
    if (!this.tokenSet?.fresh)
      await this.refresh()

    try {
      let { payload } = await jwtVerify(this.tokenSet.idToken, this.jwks, {
        issuer: this.app.opts.auth,
        audience: this.clientId
      })

      return {
        email: payload.email,
        username: payload.preferred_username
      }
    } catch (err) {
      warn({ err }, 'account: failed to verify id token')
      throw new AccountError('id-token')
    }
  }
}
