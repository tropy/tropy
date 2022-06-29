import { readFile, writeFile } from 'node:fs/promises'

// NB: load jsonld module on demand, because it's huge.
let jsonld

async function importModule() {
  await import('jsonld').then(m => jsonld = m.default)
  jsonld.useDocumentLoader('node')
}

async function proxyCompact(...args) {
  if (!jsonld) await importModule()
  return jsonld.compact(...args)
}

async function proxyExpand(...args) {
  if (!jsonld) await importModule()
  return jsonld.expand(...args)
}

async function proxyLoadDocument(...args) {
  if (!jsonld) await importModule()
  return jsonld.documentLoader(...args)
}

export {
  proxyCompact as compact,
  proxyExpand as expand,
  proxyLoadDocument as documentLoader
}

export async function open(path, ...args) {
  // TODO handle remote URLs
  let string = await readFile(path, 'utf-8')
  return parse(string, ...args)
}

export async function parse(string, { context, expand } = {}) {
  let data = JSON.parse(string)

  if (context)
    return proxyCompact(data, context)
  if (expand)
    return proxyExpand(data)
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
