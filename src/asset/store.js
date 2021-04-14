import assert from 'assert'
import { mkdir, rm, writeFile } from 'fs/promises'
import { isAbsolute, dirname, normalize, join } from 'path'
import { Asset } from './asset'
import { debug, warn } from '../common/log'
import mod from '../models/store'

export class Store {
  #root

  constructor(root) {
    this.root = root
  }

  set root(root) {
    this.#root = null

    if (root) {
      root = normalize(root)

      assert(isAbsolute(root), 'store folder path must be absolute')
      assert(dirname(root) !== root, 'store folder must not be fs root')

      this.#root = root
    }

  }

  get root() {
    return this.#root
  }

  init = async (root = this.root) => {
    this.root = root

    if (this.root)
      await mkdir(this.root, { recursive: true })
  }

  add = async (asset) => {
    try {
      if (!this.root) return

      var { path, protocol } = asset

      if (!(asset instanceof Asset))
        asset = new Asset(asset)

      if (!asset.buffer)
        await asset.open()

      asset.protocol = 'file'
      asset.path = this.getPathFor(asset)

      await writeFile(asset.path, asset.buffer, { flag: 'wx' })

    } catch (e) {
      if (e.code === 'EEXIST') return

      asset.protocol = protocol
      asset.path = path

      throw e
    }
  }

  remove = async (asset) => {
    try {
      if (!this.root) return

      if (!(asset instanceof Asset))
        asset = new Asset(asset)

      let path = this.getPathFor(asset)
      if (path !== asset.path) return

      debug(`removing "${path}" from store...`)
      await rm(path, { force: true, maxRetries: 3 })

    } catch (e) {
      warn({ stack: e.stack }, `failed removing ${asset.path}`)
    }
  }

  prune = async (db) => {
    if (this.root) {
      for (let asset of (await mod.orphaned(db))) {
        await this.remove({ protocol: 'file', ...asset })
      }
    }

    // NB this removes all deleted photos. In case some files
    // failed to be removed above, they will stay permanently
    // in the store folder.
    await mod.purge(db)
  }

  getPathFor(asset) {
    return join(this.root, `${asset.checksum}${asset.ext.toLowerCase()}`)
  }
}
