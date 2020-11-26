'use strict'

const { join } = require('path')

const BABEL_CONFIG = {
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-proposal-export-namespace-from',
    'babel-plugin-dynamic-import-node',
    '@babel/plugin-transform-modules-commonjs'
  ]
}

require('@babel/register')(BABEL_CONFIG)

const ROOT = join(__dirname, '..')
const ICONS = join(ROOT, 'res', 'icons')

module.exports = {
  ROOT,
  ICONS,
  ...require('../src/common/release')
}
