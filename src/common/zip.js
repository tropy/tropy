import { mkdir, mkdtemp, readdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from './spawn.js'

// Windows ships bsdtar, which can read zip archives.
// Use it by full path, because another tar on the PATH might not.
const extract = (src, dst) => (process.platform === 'win32') ?
  spawn(join(process.env.SystemRoot, 'System32', 'tar.exe'), ['-xf', src, '-C', dst]) :
  spawn('unzip', ['-oq', src, '-d', dst])

export async function unzip (src, dst, { strip } = {}) {
  if (!strip) {
    await mkdir(dst, { recursive: true })
    return extract(src, dst)
  }

  try {
    var tmp = await mkdtemp(`${dst}-`)
    await extract(src, tmp)
    let [head, ...tail] = await readdir(tmp, { withFileTypes: true })

    if (tail.length > 0 || !head?.isDirectory())
      await rename(tmp, dst)
    else
      await rename(join(tmp, head.name), dst)

  } finally {
    if (tmp)
      await rm(tmp, { recursive: true, force: true })
  }
}
