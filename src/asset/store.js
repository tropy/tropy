import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export class Store {
  constructor(root) {
    this.root = root
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

      if (!asset.checksum)
        await asset.open()

      asset.protocol = 'file'
      asset.path = join(this.root, `${asset.checksum}.${asset.ext}`)

      await writeFile(asset.path, asset.buffer, { flag: 'wx' })

    } catch (e) {
      if (e.code === 'EEXIST') return

      asset.protocol = protocol
      asset.path = path

      throw e
    }
  }
}
