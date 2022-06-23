import assert from 'node:assert'
import { dirname, join, normalize, relative, resolve } from 'node:path'
import { v4 as uuid } from 'uuid'
import ARGS from '../args.js'
import { into, select, update } from '../common/query.js'
import { info } from '../common/log.js'
import { home } from '../common/os.js'
import { empty } from '../common/util.js'
import { Storage } from '../storage.js'

function getBasePath(db, base) {
  switch (base) {
    case 'project':
      return dirname(db.path)
    case 'home':
      return home
    case 'documents':
    case 'pictures':
      return ARGS[base]
    default:
      return base
  }
}


function touchWatchFolder(id) {
  let watch = Storage.load('project.watch', id) || {}

  if (watch.folder) {
    watch.since = Date.now()
    Storage.save('project.watch', watch, id)
  }

  return watch.since
}



export default {
  getBasePath,

  async create(db, { name, base, id = uuid() }) {
    info(`creating project "${name}" ${id}`)
    await db.read(join(ARGS.app, 'db', 'schema', 'project.sql'))
    await db.run(...into('project').insert({
      project_id: id,
      name,
      base
    }))
  },

  async load(db) {
    let project = await db.get(
      ...select({ id: 'project_id' }, 'name', 'base', 'store')
        .from('project')
        .limit(1))

    assert(project != null, 'no project found')

    let items = await db.get(
      ...select({ total: 'COUNT (id)' })
        .from('items')
        .outer.join('trash', { using: 'id' })
        .where({ deleted: null }))

    project.basePath = getBasePath(db, project.base)
    project.items = items.total

    if (project.basePath && project.store) {
      project.store = resolve(project.basePath, normalize(project.store))
    }

    project.watch = Storage.load('project.watch', project.id) || {}

    return project
  },

  async optimize(db) {
    await db.exec(
      "INSERT INTO fts_notes(fts_notes) VALUES ('optimize')")
    await db.exec(
      "INSERT INTO fts_metadata(fts_metadata) VALUES ('optimize')")
    await db.exec(
      'VACUUM')
  },

  async reindex(db, { check } = {}) {
    if (check) {
      await db.check()
    }
    await db.exec(
      'REINDEX')
    await db.exec(
      "INSERT INTO fts_notes(fts_notes) VALUES ('rebuild')")
    await db.exec(
      "INSERT INTO fts_metadata(fts_metadata) VALUES ('rebuild')")
  },

  save(db, { id, watch, ...props }, basePath) {
    if (basePath && props.store)
      props.store = relative(basePath, props.store)

    if (watch)
      Storage.save('project.watch', watch, id)

    if (!empty(props))
      return db.run(
        ...update('project').set(props).where({ project_id: id })
      )
  },

  close(db, { id }) {
    touchWatchFolder(id)
  },

  touchWatchFolder
}
