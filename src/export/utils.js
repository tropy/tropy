'use strict'

const { array, camelize } = require('../common/util')
const { getLabel } = require('../common/ontology')
const { entries } = Object

function propertyLabel(property, props, template) {
  var label, field
  try {
    if (template) {
      field = template.fields.find(f => f.property === property)
      label = field && field.label
    }
    if (!label) {
      label = props[property] && props[property].label
    }
    if (!label) {
      label = getLabel(field.id)
    }
    return label
  } catch (_) { return label }
}

function shortenLabel(label) {
  return camelize(
    label
    .toLowerCase()
    .trim()
    .normalize('NFD')                // normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // remove accents, ligatures
    .replace(/[^a-zA-Z0-9]+/g, ' ')  // remove non-alphanumeric
  ).replace('_', ' ')                // remove _
}

function shorten() {
  const label = propertyLabel(...arguments)
  if (label) return shortenLabel(label)
}

function newProperties(src, dest, toContext = false, props, template) {
  // TODO check with dest for possible key collision
  for (const itemMetadata of array(src)) {
    for (const [property, { type, text }] of entries(itemMetadata)) {
      const key = shorten(property, props, template)
      if (toContext && key && type) {
        dest[key] = { '@id': property, '@type': type }
      }
      if (!toContext && key && text) {
        dest[key] = text
      }
    }
  }
  return dest
}

module.exports = {
  shortenLabel,
  propertyLabel,
  shorten,
  newProperties
}
