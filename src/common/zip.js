import fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import crossZip from 'cross-zip'
import { mkdtmp } from './os'

const { readdir, rename, rmdir } = fs.promises
const unzipAsync = promisify(crossZip.unzip)

export const zip = promisify(crossZip.zip)

//unzip.sync = crossZip.unzipSync
//zip.sync = crossZip.zipSync

export async function unzip(src, dst, { strip } = {}) {
  if (!strip)
    return unzipAsync(src, dst)

  try {
    var tmp = await mkdtmp('tropy-unzip')
    await unzipAsync(src, tmp)
    let [head, ...tail] = await readdir(tmp, { withFileTypes: true })

    if (tail.length > 0 || !head?.isDirectory())
      await rename(tmp, dst)
    else
      await rename(join(tmp, head.name), dst)

  } finally {
    if (tmp)
      await rmdir(tmp, { recursive: true })
  }
}
