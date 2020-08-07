import babel from '@rollup/plugin-babel'
import builtins from 'builtin-modules'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: [
    './src/browser/main.js',
    './src/common/api.js'
  ],
  output: {
    dir: './lib',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    json(),
    babel({ babelHelpers: 'bundled' }),
    commonjs({
      ignore: [
        'pino-pretty',
        'decompress'
      ]
    })
  ],
  external: [
    'electron',
    ...builtins
  ]
}
