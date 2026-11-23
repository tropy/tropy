import { createSelector as memo } from '@reduxjs/toolkit'
import { selectActiveItems } from '../slices/nav/cursor.js'
import { by, equals } from '../collate.js'

const byName = by('name')
const getTags = ({ tags }) => tags

export const getAllTags = memo(
  getTags,
  (tags) => Object.values(tags).sort(byName)
)

export const findTag = ({ tags }, { id, name }) =>
  (name) ?
    findByName(tags, name) :
    tags[id] || findByName(tags, id)

const findByName = (tags, name, idOnly = false) => {
  for (let id in tags) {
    if (equals(tags[id].name, name))
      return idOnly ? Number(id) : tags[id]
  }
  return null
}

export const findTagIds = ({ tags }, tx) =>
  tx.map(x =>
    (!(x in tags) && findByName(tags, x, true)) || Number(x))

export const getItemTags = memo(
  getTags,
  selectActiveItems,

  (tags, items) => {
    const counts = {}

    // Lazy: each tag is counted and checked before the next one.
    return items.values()
      .flatMap(item => item.tags)
      .map(id => ((counts[id] = (counts[id] || 0) + 1), tags[id]))
      .filter(tag => tag != null && counts[tag.id] === 1)
      .toArray()
      .map(tag => ({
        ...tag,
        count: counts[tag.id],
        mixed: counts[tag.id] < items.length
      }))
      .sort(byName)
  }
)

export const getTagCompletions = memo(
  getAllTags,
  getItemTags,

  (tags, itemTags) => tags
    .filter(tag => !itemTags.find(t => !t.mixed && t.id === tag.id))
    .map(tag => tag.name)
)

export const getTagColors = memo(
  getTags,
  (_, tagIds) => tagIds,

  (tags, tagIds) => {
    let skip = Object.create({})
    let colors = []

    if (tagIds) {
      for (let id of tagIds) {
        let color = tags[id]?.color

        if (color && !skip[color]) {
          colors.push(color)
          skip[color] = true
        }
      }
    }

    return colors
  })
