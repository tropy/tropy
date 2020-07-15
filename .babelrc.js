'use strict'

const plugins = [
  '@babel/plugin-syntax-class-properties'
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
