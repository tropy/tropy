import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { mktmp } from './tmp.js'
import { create } from '#tropy/common/project.js'

const fixtures = join(import.meta.dirname, '../fixtures')
const appDir = join(fixtures, '../..')
const schema = join(appDir, 'db/schema/project.sql')

export function mkprojtmp(file, opts) {
  let project = { current: null }
  let path = mktmp(file)

  beforeEach(async () => {
    let db = await create(path, schema, appDir, {
      ...opts,
      autoclose: false
    })

    project.current = { db, path }
  })

  afterEach(async () => {
    await project.current?.db.close()
    await rm(path, { recursive: true })
  })

  return project
}
