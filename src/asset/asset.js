import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { URL, fileURLToPath, pathToFileURL } from 'node:url'
import { magic } from './magic.js'
import { pick } from '../common/util.js'


export class Asset {
  static async open(props, ...args) {
    return (new this(props)).open(props, ...args)
  }

  static async check(props, ...args) {
    return (new this(props)).check(props, ...args)
  }

  #path = null

  constructor({ path, protocol, checksum, mimetype }) {
    // Set protocol first to avoid auto-dection!
    this.protocol = protocol
    this.path = path

    // Subtle: original filename; doesn't automatically update if path changes!
    this.filename = this.basename

    this.checksum = checksum
    this.mimetype = mimetype
  }

  get basename() {
    return this.isRemote ?
      basename(decodeURIComponent((new URL(this.url)).pathname)) :
      basename(this.path)
  }

  get date() {
    return this.fs?.ctime || this.fs?.mtime || new Date()
  }

  get ext() {
    return extname(this.basename)
  }

  get mtime() {
    return this.fs?.mtime
  }

  get name() {
    return basename(this.basename, this.ext)
  }

  get isRemote() {
    return this.protocol !== 'file'
  }

  set path(path) {
    if (this.protocol == null) {
      let m = path.match(/^([a-z]+):\/\//i)

      if (m == null) {
        this.protocol = 'file'
      } else {
        this.protocol = m[1].toLowerCase()

        path = (this.protocol === 'file') ?
          fileURLToPath(path) :
          path.slice(m[0].length)
      }
    }

    this.#path = path
  }

  get path() {
    return this.#path
  }

  get size() {
    return this.fs?.size
  }

  get url() {
    return this.isRemote ?
      `${this.protocol}://${this.path}` :
      pathToFileURL(this.path)
  }

  async check({ fastCheck = false, checksum, mtime, ...opts }, ...args) {
    try {
      this.hasChanged = false
      this.error = null

      // fastCheck may return early without opening the asset!
      if (fastCheck && mtime && !this.isRemote) {
        if (mtime === (await stat(this.path)).mtime)
          return this
      }

      await this.open(opts, ...args)
      this.hasChanged = checksum !== this.checksum

    } catch (e) {
      this.hasChanged = true
      this.error = e
    }

    return this
  }

  async open() {
    try {
      if (this.isRemote) {
        let res = await fetch(this.url, { redirect: 'follow' })

        if (!res.ok)
          throw new Error(`failed fetching remote asset: ${res.status}`)

        this.buffer = Buffer.from(await res.arrayBuffer())
        this.fs = {
          size: this.buffer.length,
          mtime: new Date(
            Date.parse(res.headers.get('Last-Modified')) || Date.now()
          )
        }

      } else {
        this.fs = await stat(this.path)
        this.buffer = await readFile(this.path)
      }

      let hash = createHash('md5')
      hash.update(this.buffer)
      this.checksum = hash.digest('hex')

      this.mimetype = magic(this.buffer, this.ext)

      return this

    } catch (e) {
      this.buffer = null
      this.checksum = null
      this.fs = null
      this.mimetype = null

      throw e
    }
  }

  toJSON() {
    return pick(this, [
      'filename',
      'path',
      'protocol',
      'checksum',
      'mimetype',
      'size'
    ])
  }
}
