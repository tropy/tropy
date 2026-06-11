import assert from 'node:assert/strict'
import { ipcRenderer } from 'electron'
import ARGS from './args.js'
import { TokenSet } from './common/token-set.js'
import { retry } from './common/net.js'

let tokenSet

export async function getAccessToken (forceRefresh = false) {
  assert(ARGS.account.linked, 'no linked account')

  if (forceRefresh || !tokenSet?.fresh) {
    let values = await ipcRenderer.invoke('account', 'getAccessToken')
    tokenSet = new TokenSet(values)
  }

  return tokenSet
}

export async function request (pathname, options = {}, forceRefresh = false) {
  let { accessToken } = await getAccessToken(forceRefresh)
  let res = await retry(new URL(pathname, ARGS.account.url), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!forceRefresh && (res.status === 401 || res.status === 403)) {
    return request(pathname, options, true)
  }

  return res
}
