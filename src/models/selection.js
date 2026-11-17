import assert from 'node:assert'
import { empty, json, omit, pick, stringify } from '../common/util.js'
import { props } from '../common/export.js'
import { close, open, rectangle, round } from '../common/geometry.js'
import { into, select, update } from '../common/query.js'
import sql, { IN } from '../common/sql.js'
import image from './image.js'
import metadata from './metadata.js'
import note from './note.js'
import subject from './subject.js'
import * as transcription from './transcription.js'

async function loadIds (db, photos) {
  let ids = {}

  await db.each(
    ...select('id', 'photo_id')
      .from('selections')
      .outer.join('trash', { using: 'id' })
      .where({ photo_id: photos, deleted: null })
      .order('position'),
    ({ id, photo_id: photo }) => {
      if (photo in ids)
        ids[photo].push(id)
      else
        ids[photo] = [id]
    })

  return ids
}

async function load (db, ids) {
  let selections = {}

  await Promise.all([
    db.each(
      ...select(
        'id',
        'photo_id AS photo',
        'x',
        'y',
        'polygon',
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
        "strftime('%Y-%m-%dT%H:%M:%f', created, 'localtime') AS created",
        "strftime('%Y-%m-%dT%H:%M:%f', modified, 'localtime') AS modified")
        .from('subjects')
        .join('images', { using: 'id' })
        .join('selections', { using: 'id' })
        .where({ id: ids }),
      ({ id, created, modified, mirror, negative, polygon, ...data }) => {
        data.created = new Date(created)
        data.modified = new Date(modified)
        data.mirror = !!mirror
        data.negative = !!negative

        data.polygon = (polygon != null) ?
          open(json(polygon)) :
          rectangle(data)

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

const ring = (polygon) =>
  stringify(close(round(polygon)))


export default {
  load,
  loadIds,

  async create (db, {
    template,
    photo,
    x,
    y,
    polygon,
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
      polygon: ring(polygon ?? rectangle({ x, y, ...image }))
    }))

    if (!empty(data)) {
      await metadata.update(db, { id, data })
    }

    return (await load(db, [id]))[id]
  },

  async copy (db, { source, target: photo }) {
    let { id } = await subject.dup(db, source)

    await image.copy(db, { source, target: id })

    await db.run(`
      INSERT INTO selections (id, photo_id, position, x, y, polygon)
        SELECT ?, ?, position, x, y, polygon
          FROM selections
          WHERE id = ?`, id, photo, source)

    await metadata.copy(db, { source, target: id })

    let notes = await note.copy(db, { source, target: id })
    let transcriptions = await transcription.copy(db, { source, target: id })

    return {
      selection: (await load(db, [id]))[id],
      notes,
      transcriptions
    }
  },

  async save (db, { id, timestamp, polygon, ...data }) {
    assert(id != null, 'missing selection id')

    if (polygon != null) {
      await db.run(
        ...update('selections')
          .set({ polygon: ring(polygon) })
          .where({ id }))
    }

    data = omit(data, ['x', 'y', 'width', 'height'])

    await image.save(db, { id, timestamp, ...data })

    if (timestamp != null && empty(pick(data, props.image))) {
      await subject.touch(db, { id, timestamp })
    }
  },

  async order (db, photo, selections, offset) {
    if (selections.length) {
      return db.run(sql`
        UPDATE selections
          SET position = ${offset ?? 0} + o.key + 1
          FROM json_each(${selections}) AS o
          WHERE selections.id = o.value AND photo_id = ${photo}`)
    }
  },

  async delete (db, ...ids) {
    return db.run(sql`
      INSERT INTO trash (id)
        SELECT value FROM json_each(${ids})`)
  },

  async restore (db, ...ids) {
    return db.run(sql`
      DELETE FROM trash WHERE id ${IN(ids)}`)
  },

  async prune (db) {
    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash JOIN selections USING (id)
        )`
    )
  }
}
