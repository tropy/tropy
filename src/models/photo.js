import assert from 'node:assert'
import { relative, resolve } from 'node:path'
import metadata from './metadata.js'
import subject from './subject.js'
import { into, select, update } from '../common/query.js'
import { normalize } from '../common/os.js'
import { blank, empty, pick, pMap } from '../common/util.js'
import { props } from '../common/export.js'

const skel = (id, selections = [], notes = [], transcriptions = []) => ({
  id, selections, notes, transcriptions
})

async function load(db, ids, { basePath } = {}) {
  let photos = {}

  await Promise.all([
    db.each(
      ...select(
          'id',
          'item_id AS item',
          'template',
          'strftime("%Y-%m-%dT%H:%M:%f", created, "localtime") AS created',
          'strftime("%Y-%m-%dT%H:%M:%f", modified, "localtime") AS modified',
          'angle',
          'color',
          'density',
          'mirror',
          'negative',
          'brightness',
          'contrast',
          'hue',
          'saturation',
          'sharpen',
          'width',
          'height',
          'path',
          'filename',
          'page',
          'size',
          'protocol',
          'mimetype',
          'checksum',
          'orientation')
        .from('subjects')
        .join('images', { using: 'id' })
        .join('photos', { using: 'id' })
        .where({ id: ids }),

      ({ id, created, modified, mirror, negative, path, ...data }) => {
        data.created = new Date(created)
        data.modified = new Date(modified)
        data.mirror = !!mirror
        data.negative = !!negative
        data.path = (
          (basePath && data.protocol === 'file') ?
            resolve(basePath, normalize(path)) : path
        ).normalize()

        if (id in photos) Object.assign(photos[id], data)
        else photos[id] = Object.assign(skel(id), data)
      }
    ),

    db.each(
      ...select('id', 'photo_id')
        .from('selections')
        .outer.join('trash', { using: 'id' })
        .where({ photo_id: ids, deleted: null })
        .order('photo_id')
        .order('position'),
      ({ id: sid, photo_id: id }) => {
        if (id in photos)
          photos[id].selections.push(sid)
        else
          photos[id] = skel(id, [sid])
      }
    ),

    db.each(
      ...select('id', 'note_id')
        .from('notes')
        .join('photos', { using: 'id' })
        .where({ id: ids, deleted: null })
        .order(['id', 'created']),
      ({ id, note_id: nid }) => {
        if (id in photos)
          photos[id].notes.push(nid)
        else
          photos[id] = skel(id, [], [nid])
      }
    ),

    db.each(
      ...select('id', 'transcription_id')
        .from('transcriptions')
        .join('photos', { using: 'id' })
        .where({ id: ids, deleted: null })
        .order(['created', 'id']),
      ({ id, transcription_id: tid }) => {
        if (id in photos)
          photos[id].transcriptions.push(tid)
        else
          photos[id] = skel(id, [], [], [tid])
      }
    )
  ])

  return photos
}

export default {
  async create(db, { basePath, template }, { item, image, data, position }) {
    let { protocol = 'file', path, ...meta } = image
    let { id } = await subject.create(db, { template })

    if (basePath && protocol === 'file') {
      path = relative(basePath, path)
    }

    await db.run(...into('images').insert({
      id,
      ...pick(meta, props.image)
    }))

    await Promise.all([
      db.run(...into('photos').insert({
        id,
        item_id: item,
        path,
        position,
        protocol,
        ...pick(meta, props.photo)
      })),

      metadata.update(db, { id, data })
    ])

    return (await load(db, [id], { basePath }))[id]
  },

  async save(db, { id, timestamp, ...data }, { basePath } = {}) {
    let photo = pick(data, props.photo)
    let image = pick(data, ['width', 'height'])

    assert(id != null, 'missing photo id')
    if (empty(photo)) return

    if (basePath && photo.path && photo.protocol === 'file') {
      photo.path = relative(basePath, photo.path)
    }

    await db.run(...update('photos').set(photo).where({ id }))

    if (!empty(image)) {
      await db.run(...update('images').set(image).where({ id }))
    }

    if (timestamp != null) {
      await subject.touch(db, { id, timestamp })
    }
  },

  load,
  find(db, { checksum }) {
    return db.get(`
      SELECT p.id, item_id AS item
        FROM photos p
          LEFT OUTER JOIN trash tp USING (id)
          LEFT OUTER JOIN trash ti ON (ti.id = item_id)
        WHERE checksum = ?
          AND tp.deleted IS NULL
          AND ti.deleted IS NULL`, checksum)
  },

  async move(db, { ids, item }) {
    return db.run(`
      UPDATE photos SET item_id = ?  WHERE id in (${ids.join(',')})`,
      item)
  },

  async order(db, item, photos, offset = 0) {
    if (!blank(photos)) {
      return db.run(`
        UPDATE photos
          SET position = CASE id
            ${photos.map((_, idx) =>
              (`WHEN ? THEN ${offset + idx + 1}`)).join(' ')}
            END
          WHERE item_id = ?`,
        ...photos, item)
    }
  },

  async merge(db, item, photos, offset = 0) {
    if (!blank(photos)) {
      return db.run(`
        UPDATE photos
          SET item_id = ?, position = CASE id
            ${photos.map((_, idx) =>
              (`WHEN ? THEN ${offset + idx + 1}`)).join(' ')}
            END
          WHERE id IN (${photos.join(',')})`,
        item, ...photos)
    }
  },

  async split(db, item, items, concurrency = 4) {
    return pMap(items, ({ id, photos }) =>
      db.run(`
        UPDATE photos
          SET item_id = ?, position = CASE id
            ${photos.map((_, idx) =>
              (`WHEN ? THEN ${idx + 1}`)).join(' ')}
            END
          WHERE id IN (${photos.join(',')})`,
        id, ...photos), { concurrency })
  },

  async delete(db, ids) {
    return db.run(`
      INSERT INTO trash (id)
        VALUES ${ids.map(id => `(${id})`).join(',')}`)
  },

  async restore(db, { ids }) {
    return db.run(`
      DELETE FROM trash WHERE id IN (${ids.join(',')})`)
  },

  async prune(db) {
    return db.run(`
      DELETE FROM subjects
        WHERE id IN (
          SELECT id FROM trash JOIN photos USING (id)
        )`
    )
  },

  async rebase(db, base, oldBase) {
    let delta = []

    await db.each(
      ...select('id', 'path')
        .from('photos')
        .where({ protocol: 'file' }),
        ({ id, path }) => {
          let oldPath = oldBase ? resolve(oldBase, normalize(path)) : path
          let newPath = base ? relative(base, oldPath) : oldPath
          if (newPath !== path) {
            delta.push({ id, path: newPath })
          }
        })

    await pMap(delta, ({ id, path }) => db.run(
      ...update('photos').set({ path }).where({ id })
    ))
  }
}
