import { mkdir } from 'fs/promises'


export class Store {
  constructor(root) {
    this.root = root
  }

  init = async (root = this.root) => {
    this.root = root

    if (this.root)
      await mkdir(this.root, { recursive: true })
  }
}
