'use strict'

const presets = [
  '@babel/preset-react'
]

const plugins = [
  '@babel/plugin-syntax-class-properties',
  '@babel/plugin-transform-modules-commonjs'
]

if (process.env.COVERAGE)
  plugins.push(['istanbul', {
    include: ['src/**/*.js']
  }])

require('@babel/register')({
  presets,
  plugins
})
