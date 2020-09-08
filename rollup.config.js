import babel from '@rollup/plugin-babel'
import builtins from 'builtin-modules'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import natives from 'rollup-plugin-natives'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'

const NODE_ENV = process.env.NODE_ENV || 'production'

export default [
  {
    input: [
      'src/browser/main.js',
      'src/common/api.js'
    ],
    output: {
      dir: 'lib/browser',
      format: 'cjs',
      sourcemap: false
    },
    preserveEntrySignatures: 'strict',
    plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' }),
      json(),
      commonjs({
        ignore: [
          'pino-pretty'
        ]
      })
    ],
    external: [
      'electron',
      ...builtins
    ]
  },

  {
    input: {
      'bootstrap': 'src/bootstrap.js',
      'image': 'src/image/index.js',
      'db': 'src/common/db.js',
      'views/about': 'src/views/about.js',
      'views/prefs': 'src/views/prefs.js',
      'views/project': 'src/views/project.js',
      'views/print': 'src/views/print.js',
      'views/wizard': 'src/views/wizard.js'
    },
    output: {
      dir: 'lib',
      format: 'cjs',
      sourcemap: true
    },
    preserveEntrySignatures: 'strict',
    plugins: [
      natives({
        copyTo: 'lib/node/lib',
        destDir: './node/lib'
      }),
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'readable-stream': 'stream'
      }),
      json(),
      babel({ babelHelpers: 'bundled' }),
      commonjs({
        ignore: [
          'pino-pretty',
          'request',
          'rdf-canonize-native'
        ]
      })
    ],
    external: [
      'electron',
      ...builtins
    ]
  }
]
