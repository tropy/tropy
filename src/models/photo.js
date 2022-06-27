import assert from 'assert'
import { relative, resolve } from 'path'
import metadata from './metadata'
import Bluebird from 'bluebird'
import subject from './subject'
import { into, select, update } from '../common/query'
import { normalize } from '../common/os'
import { blank, empty, pick } from '../common/util'
import { props } from '../common/export'

const skel = (id, selections = [], notes = []) => ({
  id, selections, notes
})

async function load(db, ids, { basePath } = {}) {
  const photos = {}
  if (ids != null) ids = ids.join(',')

  await Promise.all([
    db.each(`
      SELECT
          id,
          item_id AS item,
          template,
          datetime(created, "localtime") AS created,
          datetime(modified, "localtime") AS modified,
          angle,
          color,
          density,
          mirror,
          negative,
          brightness,
          contrast,
          hue,
          saturation,
          sharpen,
          width,
          height,
          path,
          filename,
          page,
          size,
          protocol,
          mimetype,
          checksum,
          orientation
        FROM subjects
          JOIN images USING (id)
          JOIN photos USING (id)${
        ids != null ? ` WHERE id IN (${ids})` : ''
      }`,
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

    db.each(`
      SELECT id AS selection, photo_id AS id
        FROM selections
          LEFT OUTER JOIN trash USING (id)
        WHERE ${ids != null ? `photo_id IN (${ids}) AND` : ''}
          deleted IS NULL
        ORDER BY photo_id, position`,
      ({ selection, id }) => {
        if (id in photos) photos[id].selections.push(selection)
        else photos[id] = skel(id, [selection])
      }
    ),

    db.each(`
      SELECT id, note_id AS note
        FROM notes JOIN photos using (id)
        WHERE ${ids != null ? `id IN (${ids}) AND` : ''} deleted IS NULL
        ORDER BY id, created`,
      ({ id, note }) => {
        if (id in photos) photos[id].notes.push(note)
        else photos[id] = skel(id, [], [note])
      }
    )
  ])

  return photos
}

export default {
  async create(db, { basePath, template }, { item, image, data, position }) {
    let { protocol = 'file', path, ...meta } = image
    let { id } = await db.run(
      ...into('subjects').insert({ template })
    )

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
    return Bluebird.map(items, ({ id, photos }) =>
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

    await Bluebird.map(delta, ({ id, path }) => db.run(
      ...update('photos').set({ path }).where({ id })
    ))
  }
}
