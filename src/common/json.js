import fs from 'fs'
const { readFile, writeFile } = fs.promises

// NB: load jsonld module on demand, because it's huge.
let jsonld

async function proxyCompact(...args) {
  if (!jsonld) jsonld = await import('jsonld')
  return jsonld.compact(...args)
}

async function proxyExpand(...args) {
  if (!jsonld) jsonld = await import('jsonld')
  return jsonld.expand(...args)
}

export {
  proxyCompact as compact,
  proxyExpand as expand
}

export async function open(path, ...args) {
  // TODO handle remote URLs
  let string = await readFile(path, 'utf-8')
  return parse(string, ...args)
}

export async function parse(string, { context, expand } = {}) {
  let data = JSON.parse(string)

  if (context)
    return jsonld.compact(data, context)
  if (expand)
    return jsonld.expand(data)
  else
    return data
}

export async function write(file, data, {
  context,
  expand,
  indent,
  ...opts
} = {}) {

  if (context)
    data = await jsonld.compact(data, context)
  if (expand)
    data = await jsonld.expand(data)

  return writeFile(file, JSON.stringify(data, null, indent), opts)
}
