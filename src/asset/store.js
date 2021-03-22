import { mkdir } from 'fs/promises'


export class Store {
  init = async (root) => {
    this.root = null

    if (root) {
      await mkdir(root, { recursive: true })
      this.root = root
    }
  }
}
