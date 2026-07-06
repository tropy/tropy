import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { ipcRenderer } from 'electron'
import ARGS from './args.js'
import { HttpError } from './common/error.js'
import { md5 } from './common/crypto.js'
import { TokenSet } from './common/token-set.js'
import { retry } from './common/net.js'
import { debug } from './common/log.js'

// const TEXT_TITAN = 356425
const TEXT_TITAN_II = 579509
const DEFAULT_MODEL = TEXT_TITAN_II

let tokenSet

export function isLinked () {
  return ARGS.account.linked === true
}

export async function getAccessToken (forceRefresh = false) {
  assert(isLinked(), 'no linked account')

  if (forceRefresh || !tokenSet?.fresh) {
    let { payload } = await ipcRenderer.invoke('account', 'getAccessToken')
    tokenSet = new TokenSet(payload)
  }

  return tokenSet
}

export async function request (pathname, options = {}, forceRefresh = false) {
  let { accessToken } = await getAccessToken(forceRefresh)
  let url = new URL(pathname, ARGS.account.url)

  debug({ url, options }, 'account service request')

  let res = await retry(url, {
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

export async function upload ({ buffer, type }) {
  let checksum = md5(buffer)
  let contentMd5 = Buffer.from(checksum, 'hex').toString('base64')
  let contentType = `image/${type}`

  let res = await request(`/uploads/${checksum}.${type}`, {
    method: 'GET',
    headers: {
      'X-Content-Length': buffer.length,
      'X-Content-MD5': contentMd5,
      'X-Content-Type': contentType
    }
  })

  switch (res.status) {
    case 204:
      return `${checksum}.${type}`
    case 202: {
      let url = res.headers.get('location')

      let put = await fetch(url, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-MD5': contentMd5,
          'Content-Type': contentType
        }
      })

      if (!put.ok) {
        throw await HttpError.from(put)
      }

      return `${checksum}.${type}`
    }
    default:
      throw await HttpError.from(res)
  }
}

export async function transcribe (image, { model } = {}) {
  let images = [await upload(image)]

  let res = await request('/transcription', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ config: {
      model: model ?? DEFAULT_MODEL
    }, images })
  })

  if (!res.ok) {
    throw await HttpError.from(res)
  }

  return res.json()
}

export async function getTranscription (jobId, options = {}) {
  let res = await request(`/transcription/${jobId}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers
    }
  })

  if (!res.ok) {
    throw await HttpError.from(res)
  }

  return res.json()
}
