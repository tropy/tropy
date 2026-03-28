import { rm } from 'node:fs/promises'
import { mktmp } from './tmp.js'
import { create } from '#tropy/common/project.js'

export function mkprojtmp(file, opts) {
  let project = { current: null }
  let path = mktmp(file)

  beforeEach(async () => {
    let db = await create(path, F.schema('project'), F.appDir, {
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
