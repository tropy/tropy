import { empty, list, pick } from '../common/util.js'
import { props } from '../common/export.js'
import { into, select } from '../common/query.js'
import metadata from './metadata.js'
import subject from './subject.js'

async function load(db, ids) {
  let selections = {}

  await Promise.all([
    db.each(
      ...select(
        'id',
        'photo_id AS photo',
        'x',
        'y',
        'width',
        'height',
        'angle',
        'mirror',
        'negative',
        'brightness',
        'contrast',
        'hue',
        'saturation',
        'sharpen',
        'template',
        'strftime("%Y-%m-%dT%H:%M:%f", created, "localtime") AS created',
        'strftime("%Y-%m-%dT%H:%M:%f", modified, "localtime") AS modified')
        .from('subjects')
        .join('images', { using: 'id' })
        .join('selections', { using: 'id' })
        .where({ id: ids }),
      ({ id, created, modified, mirror, negative, ...data }) => {
        data.created = new Date(created)
        data.modified = new Date(modified)
        data.mirror = !!mirror
        data.negative = !!negative

        if (id in selections)
          Object.assign(selections[id], data)
        else
          selections[id] = Object.assign({
            id,
            notes: [],
            transcriptions: []
          }, data)
      }),

    db.each(
      ...select('id', 'note_id')
        .from('notes')
        .join('selections', { using: 'id' })
        .where({ id: ids, deleted: null })
        .order(['created', 'id']),
      ({ id, note_id: nid }) => {
        if (id in selections)
          selections[id].notes.push(nid)
        else
          selections[id] = { id, notes: [nid], transcriptions: [] }
      }),

    db.each(
      ...select('id', 'transcription_id')
        .from('transcriptions')
        .join('selections', { using: 'id' })
        .where({ id: ids, deleted: null })
        .order(['created', 'id']),
      ({ id, transcription_id: tid }) => {
        if (id in selections)
          selections[id].transcriptions.push(tid)
        else
          selections[id] = { id, notes: [], transcriptions: [tid] }
      })
  ])

  return selections
}


export default {
  load,

  async create(db, {
    template,
    photo,
    x,
    y,
    position,
    data,
    ...image
  }) {
    const { id } = await subject.create(db, { template })

    await db.run(
      ...into('images').insert({ id, ...pick(image, props.image) }))

    await db.run(...into('selections').insert({
      id,
      photo_id: photo,
      position,
      x,
      y
    }))

    if (!empty(data)) {
      await metadata.update(db, { id, data })
    }

    return (await load(db, [id]))[id]
  },

  async order(db, photo, selections, offset = 0) {
    if (selections.length) {
      return db.run(`
        UPDATE selections
          SET position = CASE id
            ${selections.map((_, idx) =>
              (`WHEN ? THEN ${offset + idx + 1}`)).join(' ')}
            END
          WHERE photo_id = ?`,
      ...selections, photo)
    }
  },

  async delete(db, ...ids) {
    return db.run(`
      INSERT INTO trash (id)
        VALUES ${ids.map(id => `(${id})`).join(',')}`)
  },

  async restore(db, ...ids) {
    return db.run(`
      DELETE FROM trash WHERE id IN (${list(ids)})`
    )
  },

  async prune(db) {
    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash JOIN selections USING (id)
        )`
    )
  }
}
