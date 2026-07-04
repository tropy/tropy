import { STATUS_CODES } from 'node:http'

export class DuplicateError extends Error {
  name = 'DuplicateError'
  constructor (file) {
    super(`Duplicate file detected: ${file}`)
    this.file = file
  }
}

export class AccountError extends Error {
  name = 'AccountError'
  constructor (code, message = code, ...args) {
    super(message, ...args)
    this.code = code
  }
}
export class IpcError extends Error {
  constructor (payload) {
    super(payload.message)
    this.name = payload.name ?? 'IpcError'
    this.code = payload.code
    this.channel = payload.channel
    this.command = payload.command
  }
}

// RFC 9457 Problem Details
const isProblemDetails = (type, body) => {
  if ((/application\/problem\+json/i).test(type))
    return true
  if (body == null || typeof body !== 'object')
    return false
  if (typeof body.status !== 'number')
    return false
  if (typeof body.title === 'string' || typeof body.detail === 'string')
    return true
  else
    return false
}

export class HttpError extends Error {
  name = 'HttpError'

  static async from (response) {
    let type = response.headers.get('content-type') || ''
    let body = null

    try {
      body = (/[/+]json/i).test(type)
        ? await response.json()
        : await response.text()
    } catch {
      // ignore
    }

    return new HttpError({
      body,
      status: response.status,
      statusText: response.statusText,
      type,
      url: response.url
    })
  }

  constructor ({
    body,
    status,
    statusText,
    type,
    url
  } = {}, ...args) {
    let problem = isProblemDetails(type, body) ? body : null
    let title = problem?.title || STATUS_CODES[status] || statusText || 'HTTP Error'
    let detail = problem?.detail || (typeof body === 'string' ? body : null)

    super(detail || title, ...args)

    this.title = title
    this.detail = detail
    this.status = problem?.status || status
    this.url = url

    this.code = (STATUS_CODES[this.status] || 'Unknown')
      .toUpperCase()
      .replace(/\W+/g, '_')

    this.type = problem?.type
    this.instance = problem?.instance
  }
}
