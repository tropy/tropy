'use strict'

const plugins = [
  '@babel/plugin-syntax-class-properties',
  '@babel/plugin-syntax-object-rest-spread'
]

if (process.env.COVERAGE) {
  plugins.push(['istanbul', {
    coverageVariable: '__coverage__'
  }])
}

module.exports = {
  presets: [
    '@babel/preset-react'
  ],
  only: [
    './src',
    './test'
  ],
  plugins
}
