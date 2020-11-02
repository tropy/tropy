import { basename, resolve } from 'path'
import { version, name, productName } from '../../package.json'
import { parse } from 'semver'

const { platform } = process
const v = parse(version)

export const channel = (v?.prerelease.length > 0) ?
  (v.prerelease[0] === 'beta' ? 'beta' : 'alpha') :
  'latest'

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

export const exe = (platform === 'linux') ? name : productName

export const feed = (platform === 'win32') ?
  `https://tropy.org/update/${channel}/${platform}` :
  `https://tropy.org/update/${channel}/${platform}/${version}`

export {
  name,
  productName as product,
  version
}
