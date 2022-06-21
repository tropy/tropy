import { mkdtempSync } from 'fs'
import { rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

export function mkdtmp() {
  let dir = mkdtempSync(join(tmpdir(), 'tropy-test-'))
  after(() => rm(dir, { recursive: true }))
  return dir
}

export function mktmp(file) {
  return join(mkdtmp(), file)
}
