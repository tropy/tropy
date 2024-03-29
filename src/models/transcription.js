import { warn } from '../common/log.js'
import { select, update } from '../common/query.js'
import { json } from '../common/util.js'

export async function load(db, id) {
  let transcriptions = {}

  let query = select(
    'transcription_id',
    'id',
    'config',
    'text',
    'data',
    'status',
    'created',
    'modified'
  )

  query.from('transcriptions')
  query.order('modified', 'asc')
  query.where({ deleted: null })

  if (id) {
    query.where({ transcription_id: id })
  }

  await db.each(...query, ({
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
        config: json(config),
        created: new Date(created),
        data: json(data),
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

export async function prune(db) {
  return db.run(`
    DELETE FROM transcriptions
    WHERE deleted is NOT NULL OR (
      status < 0 AND modified < datetime("now", "-1 week")
    )`)
}
