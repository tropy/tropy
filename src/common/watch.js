import { EventEmitter } from 'events'
import { warn } from './log'

let chokidar

let fsEvents
let fsEventsImportError

export async function init() {
  if (!chokidar) {
    await import('fsevents')
      .then(namespace => {
        fsEvents = namespace.default
      })
      .catch(e => {
        if (process.platform === 'darwin')
          warn(`failed to load fsEvents: ${e.message}`)

        fsEventsImportError = e
      })

    chokidar = await import('chokidar')
  }
}

// A call to this function will be injected into chokidar by Rollup!
export function getFsEvents() {
  if (fsEventsImportError) throw fsEventsImportError
  return fsEvents
}

export class Watcher extends EventEmitter {
  #watcher = null
  #path = null

  isWatching(path) {
    return this.#watcher != null && (!path || path === this.#path)
  }

  async watch(path, { since, ...opts } = {}) {
    await init()
    await this.stop()

    if (!path) return

    this.#watcher = chokidar.watch(path, {
      ...opts,
      ignoreInitial: (since == null)
    })
    this.#path = path

    if (since)
      this.#watcher.on('add', (file, stats) => {
        if (stats.ctime > since)
          this.emit('add', file, stats)
      })

    this.#watcher.on('ready', () => {
      this.#watcher.removeAllListeners('add')
      this.#watcher.on('add', (...args) => this.emit('add', ...args))
    })
  }

  async stop() {
    await this.#watcher?.close()
    this.#watcher?.removeAllListeners()
    this.#watcher = null
    this.#path = null
  }
}
