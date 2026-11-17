import { mkdir, mkdtempDisposable, readdir, rename, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { spawn } from './spawn.js'

// win32 system tar.exe can open ZIP files.
// On macOS and Linux we rely on $PATH.
const extract = (src, dst) => (process.platform === 'win32')
  ? spawn(join(process.env.SystemRoot, 'System32', 'tar.exe'), ['-xf', src, '-C', dst])
  : spawn('unzip', ['-oq', src, '-d', dst])

export async function unzip (src, dst, {
  strip = false,
  overwrite = false
} = {}) {
  if (overwrite)
    await rm(dst, { recursive: true, force: true })

  if (!strip) {
    await mkdir(dirname(dst), { recursive: true })
    await mkdir(dst)
    return extract(src, dst)
  }

  await using tmp = await mkdtempDisposable(`${dst}-`)
  await extract(src, tmp.path)

  let [head, ...tail] = await readdir(tmp.path, { withFileTypes: true })

  if (tail.length > 0 || !head?.isDirectory())
    await rename(tmp.path, dst)
  else
    await rename(join(tmp.path, head.name), dst)
}
