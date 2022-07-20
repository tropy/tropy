import { list, pick } from '../common/util'
import { into, select, update } from '../common/query'

const COLUMNS = [
  'name',
  'color',
  'created',
  'modified'
]

async function load(db, ids) {
  let tags = {}
  await db.each(
    ...select({ id: 'tag_id' }, ...COLUMNS)
      .from('tags')
      .where({ tag_id: ids }),
    (data) => { tags[data.id] = data })

  return tags
}


export default {
  load,

  async create(db, data) {
    let { id } = await db.run(
      ...into('tags')
        .insert(pick(data, COLUMNS, { tag_id: data.id })))

    return (await load(db, [id]))[id]
  },

  async save(db, { id, ...data }) {
    return db.run(
      ...update('tags')
        .set(data)
        .set('modified = datetime("now")')
        .where({ tag_id: id }))
  },

  async delete(db, ids) {
    return db.run(`
      DELETE FROM tags WHERE tag_id IN (${list(ids)})`)
  },

  async items(db, id) {
    let items = []
    await db.each(
      ...select('id')
        .from('taggings')
        .where({ tag_id: id }),
      (item) => { items.push(item.id) })

    return items
  },

  async merge(db, ids) {
    let [keepId, ...mergeIds] = ids
    let itemsWithOldTags = new Set()
    // find all item ids which have taggings of tags to be deleted
    for (const id of mergeIds) {
      itemsWithOldTags.add(...await this.items(db, id))
    }

    // delete all tags except the one to be kept
    // on delete cascade causes taggings to be removed too
    await this.delete(db, mergeIds)

    // recreate taggings for items which had deleted tags
    for (const item of itemsWithOldTags) {
      try {
        await db.run(
          ...into('taggings')
            .insert({ tag_id: keepId, id: item }))
      } catch (e) {
        // TODO is there a nicer way to insert if not exists?
        console.error(e)
      }
    }
    // TODO should we update the modified timestamp on the tag we kept?
  }
}
