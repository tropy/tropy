'use strict'

require('shelljs/make')

const packager = require('electron-packager')
const pkg = require('../package')
const path = require('path')
const log = require('./log')

const home = path.resolve(__dirname, '..')
const electron = require('electron-prebuilt/package')

target.all = () => {
  target.pack()
}

target.pack = (args) => {
  const tag = 'pack'
  args = args || ['all', 'all']

  packager({ // eslint-disable-line quote-props
    dir: home,
    out: path.join(home, 'dist'),
    name: pkg.productName,
    platform: args[0],
    arch: args[1],
    version: electron.version,
    asar: true,
    'app-version': pkg.version,
    prune: true,
    overwrite: true,
    ignore: [
      '/node_modules/.bin',
      '/dist',
      '/src',
      '/test',
      '/scripts'
    ]

  }, (err, dst) => {
    if (err) return log.error(err)
    log.info('%s package written to %s', args[0], dst, { tag })
  })
}

exports.package = target.pack
