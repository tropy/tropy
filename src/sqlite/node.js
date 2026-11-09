import { Handler } from './handler.js'

export default class Transport {
  #handler = new Handler()
  #closed = false

  get isClosed () {
    return this.#closed
  }

  async request (op, message, onBatch) {
    if (this.#closed) throw new Error('DB closed')
    return this.#handler.handle(op, message, onBatch)
  }

  terminate () {
    this.#closed = true
  }
}
