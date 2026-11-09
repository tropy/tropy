// The transport runs the connection in a Web Worker in the renderer,
// in process in Node (see #sqlite/transport in package.json).
import Transport from '#sqlite/transport'

export class Client {
  #transport
  #open

  constructor (path, options, { worker } = {}) {
    this.#transport = new Transport({ worker })
    this.#open = this.#transport.request('open', { path, options })
  }

  get isClosed () {
    return this.#transport.isClosed
  }

  // Requests wait for the open, so its error reaches the first caller.
  async request (op, message, onBatch) {
    await this.#open
    return this.#transport.request(op, message, onBatch)
  }

  // Does not wait for the open: closes after a failed open, too.
  async close () {
    try {
      await this.#transport.request('close', {})
    } finally {
      this.#transport.terminate()
    }
  }
}
