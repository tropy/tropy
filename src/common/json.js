'use strict'

const { readFile, writeFile } = require('fs').promises
const { rdfs } = require('./ns')
const { array } = require('./util')

// NB: load jsonld module on demand, because it's huge.
const jsonld = {
  compact(...args) {
    jsonld.compact = require('jsonld').compact
    return jsonld.compact(...args)
  },

  expand(...args) {
    jsonld.expand = require('jsonld').expand
    return jsonld.expand(...args)
  }
}

const open = async (path, ...args) => {
  // TODO handle remote URLs
  let string = await readFile(path, 'utf-8')
  return parse(string, ...args)
}

const parse = async (string, { context, expand } = {}) => {
  let data = JSON.parse(string)

  if (context)
    return jsonld.compact(data, context)
  if (expand)
    return jsonld.expand(data)
  else
    return data
}

const write = async (file, data, {
  context,
  expand,
  indent,
  ...opts
} = {}) => {

  if (context)
    data = await jsonld.compact(data, context)
  if (expand)
    data = await jsonld.expand(data)

  return writeFile(file, JSON.stringify(data, null, indent), opts)
}

const flatten = (node) =>
  array(node)
    .flatMap(container => container['@list'] || container)

const toValue = (node) =>
  node['@id'] ?
    { type: rdfs.Class, text: node['@id'] } :
    { type: node['@type'], text: node['@value'] }


module.exports = {
  compact(...args) {
    return jsonld.compact(...args)
  },
  expand(...args) {
    return jsonld.expand(...args)
  },
  open,
  parse,
  write,

  flatten,
  toValue
}
