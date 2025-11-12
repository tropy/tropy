import { EventEmitter } from 'node:events'
import { dirname } from 'node:path'
import chokidar from 'chokidar'
import { debug, info, warn } from './log.js'
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

    info({
      module: 'watch',
      opts,
      path,
      since
    }, `start watching ${dirname(path)}`)

    this.#watcher = chokidar.watch(path, {
      ...opts,
      awaitWriteFinish: true,
      alwaysStat: true,
      ignoreInitial: (since == null),
      followSymLinks: false
    })
    this.#path = path

    if (since != null) {
      this.#watcher.on('add', async (file, stats) => {
        debug({ module: 'watch', stats }, `watcher "add" ${file}`)
        if (stats.ctimeMs > since) {
          // macOS apps like Preview always update ctime.
          // Duplicate files will not be imported,
          // but additionally checking kMDItemDateAdded here,
          // saves us from evaluating same files every time.
          if (!darwin || (await mdItemDateAdded(file)) > since)
            this.emit('add', file, stats)
        }
      })
    }

    this.#watcher.on('error', (e) => {
      warn({
        module: 'watch',
        stack: e.stack
      }, `watcher "error" ${e.message}`)
    })

    this.#watcher.on('ready', () => {
      debug({ module: 'watch' }, 'watcher "ready"')
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
    warn({ module: 'watch', stack: e.stack }, `mdls failed for ${file}`)
  }

}
