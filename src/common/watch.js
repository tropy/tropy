import { EventEmitter } from 'node:events'
import { dirname } from 'node:path'
import chokidar from 'chokidar'
import { info, warn } from './log.js'
import { darwin } from './os.js'
import { execFile } from './spawn.js'

export class Watcher extends EventEmitter {
  #watcher = null
  #path = null

  isWatching(path) {
    return this.#watcher != null && (!path || path === this.#path)
  }

  async watch(path, { since, ...opts } = {}) {
    await this.stop()

    if (!path) return

    info({ path, since }, `start watching ${dirname(path)}`)

    this.#watcher = chokidar.watch(path, {
      ...opts,
      ignoreInitial: (since == null)
    })
    this.#path = path

    if (since != null) {
      this.#watcher.on('add', async (file, stats) => {
        if (stats.ctime > since) {
          // macOS apps like Preview always update ctime. We do not
          // import duplicate files, but also checking kMDItemDateAdded
          // here, saves as from importing and then skipping over the
          // same files every time.
          if (!darwin || (await mdItemDateAdded(file)) > since)
            this.emit('add', file, stats)
        }
      })
    }

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

async function mdItemDateAdded(file) {
  try {
    let { stdout } = await execFile('mdls', [
      '-name',
      'kMDItemDateAdded',
      file
    ], { encoding: 'utf-8' })

    let value = stdout.replace(/^\w+ = /, '').trim()
    return Date.parse(value)

  } catch (e) {
    warn({ stack: e.stack }, `mdls failed for ${file}`)
  }

}
