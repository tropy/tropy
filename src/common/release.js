'use strict'

const { basename, resolve } = require('path')
const { version, author, name, productName } = require('../../package.json')
const { titlecase } = require('./util')

const { platform } = process

const channel =
  version.includes('beta') ? 'beta' :
    version.includes('dev') ? 'dev' :
      'stable'

const qualified = {
  product: (channel === 'stable') ?
  productName : `${productName} ${titlecase(channel)}`,
  name: (channel === 'stable') ? name : `${name}-${channel}`
}

const lib = (function find(path, pattern) {
  let dir = basename(path)

  if (!dir.length || dir === path || pattern.test(dir))
    return path
  else
    return find(resolve(path, '..'), pattern)
})(__dirname, /^src|lib$/)

module.exports = {
  version,
  author,
  name,
  paths: {
    css: resolve(lib, '..', 'lib', 'stylesheets'),
    db: resolve(lib, '..', 'db'),
    lib,
    res: resolve(lib, '..', 'res')
  },
  product: productName,
  channel,
  qualified,
  exe: (platform === 'linux') ? qualified.name : qualified.product,
  feed: (platform === 'win32') ?
    `https://tropy.org/update/${channel}/${platform}` :
    `https://tropy.org/update/${channel}/${platform}/${version}`
}
