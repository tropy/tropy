import { EventEmitter } from 'node:events'
import { URL } from 'node:url'
import { ipcMain } from 'electron'
import { debug, info, warn } from '../common/log.js'

export class AccountService extends EventEmitter {
  constructor (app) {
    super()
    this.app = app
  }

  start () {
    ipcMain.handle('account', async (_, cmd, ...args) => {
      switch (cmd) {
        case 'link':
          return this.link(...args)
        case 'status':
          return this.status
        case 'unlink':
          return this.unlink(...args)
        default:
          warn(`account: unknown ipc invocation "${cmd}"`)
      }
    })
  }

  stop () {
    ipcMain.removeHandler('account')
  }

  url (pathname) {
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
      throw err
    }
  }

  get status () {
    let { account } = this.app.safe

    return {
      linked: account?.token != null,
      username: account?.username
    }
  }

  async link ({ username, password }) {
    try {
      let res = await this.post('/link', { username, password })

      if (!res.ok) {
        throw new Error(`account.link.${res.status}`)
      }

      let token = (await res.json()).refresh_token

      if (!token) {
        throw new Error('account.link.token-missing')
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
      throw err
    } finally {
      this.emit('change')
    }
  }

  async unlink () {
    let { account } = this.app.safe
    delete this.app.safe.account

    try {
      if (account?.token) {
        return (await this.post('/unlink', {
          refresh_token: account.token
        })).ok
      }

      return false

    } finally {
      if (account != null) {
        this.emit('change')
      }
    }
  }
}
