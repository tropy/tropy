import { rm } from 'node:fs/promises'
import { mktmp } from './tmp.js'
import { create } from '../../src/common/project.js'

// Returns a reference to a temporary project with the given file name.
//
// The project will be created in a before each hook.
// The reference will be updated with the current `path` and `db` properties.
//
// The temporary directory will be removed by an after (all) hook.
//
// The project and associated directories will be removed by an after each hook.

export function mkprojtmp(file, opts) {
  let project = { current: null }
  let path = mktmp(file)

  beforeEach(async () => {
    let db = await create(path, F.schema('project').path, {
      ...opts,
      autoclose: false
    })

    project.current = {
      db,
      path
    }
  })

  afterEach(async () => {
    await project.current?.db.close()
    await rm(path, { recursive: true })
  })

  return project
}
