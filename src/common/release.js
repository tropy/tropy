import { basename, resolve } from 'path'
import { version, name, productName } from '../../package.json'
import { titlecase } from './util'

const { platform } = process

const channel =
  version.includes('beta') ? 'beta' :
    version.includes('dev') ? 'dev' :
      'stable'

const qualified = {
  name: (channel === 'stable') ? name : `${name}-${channel}`,
  product: (channel === 'stable') ?
    productName : `${productName} ${titlecase(channel)}`
}

const lib = (function find(path, pattern) {
  let dir = basename(path)

  if (!dir.length || dir === path || pattern.test(dir))
    return path
  else
    return find(resolve(path, '..'), pattern)
})(__dirname, /^src|lib$/)

const paths = {
  css: resolve(lib, '..', 'lib', 'css'),
  db: resolve(lib, '..', 'db'),
  lib,
  res: resolve(lib, '..', 'res')
}

const exe = (platform === 'linux') ?
  qualified.name :
  qualified.product

const feed = (platform === 'win32') ?
    `https://tropy.org/update/${channel}/${platform}` :
    `https://tropy.org/update/${channel}/${platform}/${version}`

export {
  channel,
  exe,
  feed,
  name,
  paths,
  productName as product,
  qualified,
  version
}
