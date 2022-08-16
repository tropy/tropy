import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function mkdtmp() {
  let dir = fs.mkdtempSync(join(tmpdir(), 'tropy-test-'))
  after(() => fs.promises.rm(dir, { recursive: true }))
  return dir
}

export function mktmp(file) {
  return join(mkdtmp(), file)
}
