'use strict'

const ex = require('./export')
const { expand, open, toList, toValue } = require('./json')
const { tropy } = require('./ns')
const { array, map, omit, get } = require('./util')

// Expand JSON-LD and ungroup item graph for backwards compatibility!
const normalize = async (json) =>
  array(await expand(json))
    .flatMap(g =>
      g['@graph'].map(item =>
        (tropy.template in item) ? item : {
          [tropy.template]: g[tropy.template],
          ...item
        }))


const toFirstValue = (_, values) =>
  toValue(values[0])

const getMetadata = (data, skip = ['@id', '@type']) =>
  map(omit(data, skip), toFirstValue)

const getPhoto = (data) => ({
  data: getMetadata(data, props.photo),
  id: get(data, ['@id', 0]),
  template: get(data, [tropy.template, 0, '@id']),
  type: get(data, ['@type', 0])
})

function *eachItem(graph) {
  for (let data of graph) {
    yield ({
      data: getMetadata(data, props.item),
      id: get(data, ['@id', 0]),
      lists: (data[tropy.list] || []).map(toValue),
      photos: toList(data[tropy.photo]).map(getPhoto),
      tags: (data[tropy.tag] || []).map(toValue),
      template: get(data, [tropy.template, 0, '@id']),
      type: get(data, ['@type', 0])
    })

  }
}

const props = {
  item: [
    '@id',
    '@type',
    ...ex.props.item.map(prop => tropy[prop])
  ],

  photo: [
    '@id',
    '@type',
    ...ex.props.photo.map(prop => tropy[prop])
  ]
}


module.exports = {
  eachItem,
  normalize,

  async open(...args) {
    return normalize(await open(...args))
  }
}
