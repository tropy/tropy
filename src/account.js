import assert from 'node:assert/strict'
import { ipcRenderer } from 'electron'
import ARGS from './args.js'
import { TokenSet } from './common/token-set.js'

let tokenSet

export async function getAccessToken () {
  assert(ARGS.account.linked, 'no linked account')

  if (!tokenSet?.fresh) {
    let values = await ipcRenderer.invoke('account', 'getAccessToken')
    tokenSet = new TokenSet(values)
  }

  return tokenSet
}
