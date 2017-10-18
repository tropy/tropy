'use strict'

const { array, camelize } = require('../common/util')
const { getLabel } = require('../common/ontology')
const { entries, values } = Object

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


function newKey(key) {
  const re = /(\d+)$/ // ends with a number
  const match = key.match(re)
  return match ? key.replace(re, Number(match[1]) + 1) : key + '2'
}

function newProperties(src, dest, toContext, props, template) {
  for (const itemMetadata of array(src)) {
    for (const [property, { type, text }] of entries(itemMetadata)) {
      let key = shorten(property, props, template)

      if (!key) continue

      // prevent key collision by modifying key if it is already set
      while (dest[key]) {
        key = newKey(key)
      }

      // either we're writing item/photo metadata or @context type info
      if (toContext) {
        // do not add same property to @context twice
        if (!values(dest).map(c => c['@id']).includes(property)) {
          if (type) dest[key] = { '@id': property, '@type': type }
        }
      } else {
        if (text) dest[key] = text
      }
    }
  }
  return dest
}

module.exports = {
  shortenLabel,
  propertyLabel,
  shorten,
  newProperties,
  newKey
}
