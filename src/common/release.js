import { basename, resolve } from 'path'
import { author, version, name, productName } from '../../package.json'
import { parse } from 'semver'
import { titlecase } from './util'

const { arch, platform } = process
const v = parse(version)
const isLatest = !(v?.prerelease.length > 0)

export const channel = (isLatest) ?
  'latest' :
  (v.prerelease[0] === 'beta' ? 'beta' : 'alpha')

export const qualified = {
  name: (isLatest) ? name : `${name}-${channel}`,
  product: (isLatest) ? productName : `${productName} ${titlecase(channel)}`
}

const lib = (function find(path, pattern) {
  let dir = basename(path)

  if (!dir.length || dir === path || pattern.test(dir))
    return path
  else
    return find(resolve(path, '..'), pattern)
})(__dirname, /^src|lib$/)

export const paths = {
  css: resolve(lib, '..', 'lib', 'css'),
  db: resolve(lib, '..', 'db'),
  lib,
  res: resolve(lib, '..', 'res')
}

export const exe = qualified[(platform === 'linux') ? 'name' : 'product']

export const feed = (platform === 'win32') ?
  `https://tropy.org/update/${channel}/${platform}/${arch}` :
  `https://tropy.org/update/${channel}/${platform}/${arch}/${version}`

export {
  author,
  name,
  productName as product,
  version
}
