import { cpSync, globSync } from 'node:fs'
import { basename, join } from 'node:path'

// Copies the files and folders matching each target's src glob
// into its dest folder (as rename, if given). Runs once per
// rollup process, so watch rebuilds don't copy them again.
export default function copy (targets) {
  let isCopied = false

  return {
    name: 'copy',
    buildEnd () {
      if (isCopied) return

      for (let { src, dest, rename } of targets) {
        for (let path of globSync(src)) {
          cpSync(path, join(dest, rename ?? basename(path)), {
            recursive: true,
            verbatimSymlinks: true
          })
        }
      }

      isCopied = true
    }
  }
}
