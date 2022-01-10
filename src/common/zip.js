import fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import crossZip from 'cross-zip'

const { mkdtemp, readdir, rename, rm } = fs.promises
const unzipAsync = promisify(crossZip.unzip)

export const zip = promisify(crossZip.zip)

//unzip.sync = crossZip.unzipSync
//zip.sync = crossZip.zipSync

export async function unzip(src, dst, { strip } = {}) {
  if (!strip)
    return unzipAsync(src, dst)

  try {
    var tmp = await mkdtemp(`${dst}-`)
    await unzipAsync(src, tmp)
    let [head, ...tail] = await readdir(tmp, { withFileTypes: true })

    if (tail.length > 0 || !head?.isDirectory())
      await rename(tmp, dst)
    else
      await rename(join(tmp, head.name), dst)

  } finally {
    if (tmp)
      await rm(tmp, { recursive: true })
  }
}
