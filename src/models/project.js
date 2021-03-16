import assert from 'assert'
import { dirname, join, normalize, relative, resolve } from 'path'
import { v4 as uuid } from 'uuid'
import ARGS from '../args'
import { into, select, update } from '../common/query'
import { info } from '../common/log'
import { home } from '../common/os'
import { paths } from '../common/release'

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


export default {
  getBasePath,

  async create(db, { name, base, id = uuid() }) {
    info(`creating project "${name}" ${id}`)
    await db.read(join(paths.db, 'schema', 'project.sql'))
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

  save(db, { id, keepOriginals, ...props }, basePath) {
    if (keepOriginals != null)
      props['keep_originals'] = keepOriginals

    if (basePath && props.store)
      props.store = relative(basePath, props.store)

    return db.run(
      ...update('project').set(props).where({ project_id: id })
    )
  }
}
