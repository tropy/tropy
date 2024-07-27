import { createSelector as memo } from 'reselect'
import { getSelectedItems } from './items.js'
import { seq, compose, filter, map, cat, keep } from 'transducers.js'
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
  getSelectedItems,

  (tags, items) => {
    const counts = {}

    return seq(items, compose(
      map(item => item.tags),
      cat,
      map(id => ((counts[id] = (counts[id] || 0) + 1), tags[id])),
      keep(),
      filter(tag => counts[tag.id] === 1)
    ))
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

  (tags, itemTags) => seq(tags,
    compose(
      filter(tag => !itemTags.find(t => !t.mixed && t.id === tag.id)),
      map(tag => tag.name)))
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
