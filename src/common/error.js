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
