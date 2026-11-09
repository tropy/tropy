export default class Transport {
  #worker
  #pending = new Map()
  #seq = 0
  #closed

  constructor ({ worker = new URL('./worker.cjs', import.meta.url) } = {}) {
    this.#worker = new Worker(worker)

    this.#worker.onmessage = ({ data: { id, value, changed, batch, error } }) => {
      let request = this.#pending.get(id)
      if (request == null) return

      if (batch) return request.onBatch(batch)

      this.#pending.delete(id)

      if (error)
        request.reject(Object.assign(new Error(error.message), error))
      else
        request.resolve({ value, changed })
    }

    this.#worker.onerror = (event) => {
      event.preventDefault()
      this.#stop(new Error(event.message || 'DB worker failed'))
    }
  }

  // A crashed or terminated worker is closed: pending and later requests
  // fail at once, instead of waiting for replies that never come.
  #stop (reason) {
    this.#closed ??= reason
    this.#worker.terminate()

    for (let request of this.#pending.values())
      request.reject(this.#closed)

    this.#pending.clear()
  }

  get isClosed () {
    return this.#closed != null
  }

  request (op, message, onBatch) {
    return new Promise((resolve, reject) => {
      if (this.#closed) return reject(this.#closed)

      let id = ++this.#seq
      this.#pending.set(id, { resolve, reject, onBatch })
      this.#worker.postMessage({ id, op, ...message })
    })
  }

  terminate () {
    this.#stop(new Error('DB worker terminated'))
  }
}
