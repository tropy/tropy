import assert from 'node:assert'
import { warn } from '../common/log.js'
import { into, select, update } from '../common/query.js'
import { json, stringify } from '../common/util.js'
import { serialize } from '../dom.js'


export async function create(db, {
  parent,
  config = {},
  text,
  data,
  angle = 0,
  mirror = false
}) {
  let status = (text) ? 1 : 0

  if (data instanceof Node)
    data = serialize(data)

  let { id } = await db.run(
    ...into('transcriptions')
      .insert({
        id: parent,
        config: stringify(config),
        data,
        text,
        angle,
        mirror,
        status
      }))

  return (await load(db, id))[id]
}

export async function load(db, id) {
  let transcriptions = {}

  let query = select(
    'transcription_id',
    'id',
    'config',
    'text',
    'data',
    'status',
    'angle',
    'mirror',
    'created',
    'modified'
  ).from('transcriptions')

  if (id) {
    query.where({ transcription_id: id })
  } else {
    query.order('modified', 'asc')
    query.where({ deleted: null })
  }

  await db.each(...query, ({
    id: parent,
    transcription_id,
    config,
    created,
    data,
    modified,
    ...props
  }) => {
    try {
      transcriptions[transcription_id] = {
        ...props,
        id: transcription_id,
        parent,
        config: json(config),
        created: new Date(created),
        data,
        deleted: false,
        modified: new Date(modified)
      }
    } catch (e) {
      warn({
        stack: e.stack
      }, `failed parsing transcription#${transcription_id}`)
    }
  })

  return transcriptions
}

export async function save(db, {
  id,
  config,
  data,
  text,
  angle,
  mirror,
  status,
  modified = new Date
}) {
  assert(id != null, 'missing id')

  if (config !== undefined)
    config = stringify(config)
  if (data instanceof Node)
    data = serialize(data)

  let query = update('transcriptions').set({
    config,
    data,
    text,
    angle,
    mirror,
    status,
    modified: modified.toISOString()
  }).where({ transcription_id: id })

  await db.run(...query)
}

export async function remove(db, id) {
  return db.run(
    ...update('transcriptions')
      .set({ deleted: Date.now() })
      .where({ transcription_id: id }))
}

export async function restore(db, id) {
  await db.run(
    ...update('transcriptions')
      .set({ deleted: false })
      .where({ transcription_id: id }))

  return load(db, id)
}

export async function prune(db, since = '-1 week') {
  return db.run(`
    DELETE FROM transcriptions
    WHERE deleted is NOT NULL OR (
      status < 0 AND datetime(modified) < datetime('now', '${since}')
    )`)
}

export async function touch(db, id) {
  await db.run(
    ...update('transcriptions')
      .set({ modified: Date.now() })
      .where({ transcription_id: id }))

  return await load(db, id)
}
