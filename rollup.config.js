import { join } from 'path'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import builtins from 'builtin-modules'
import commonjs from '@rollup/plugin-commonjs'
import ignore from 'rollup-plugin-ignore'
import json from '@rollup/plugin-json'
import natives from 'rollup-plugin-natives'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'

import scss from './scripts/rollup-plugin-scss'
import emit from './scripts/rollup-plugin-emit'

const NODE_ENV = process.env.NODE_ENV || 'production'
const platform = process.env.TROPY_PLATFORM || process.platform

export default [
  {
    input: [
      'src/browser/main.js'
    ],
    output: {
      dir: 'lib/browser',
      format: 'cjs',
      sourcemap: false
    },
    preserveEntrySignatures: 'strict',
    plugins: [
      ignore([
        'pino-pretty'
      ], { commonjsBugFix: true }),
      alias({
        entries: {
          depd: join(
            __dirname, 'node_modules/cookies/node_modules/depd/index.js'
          )
        }
      }),
      resolve(),
      babel({ babelHelpers: 'bundled' }),
      json(),
      commonjs()
    ],
    external: [
      'electron',
      ...builtins
    ]
  },

  {
    input: [
      'src/bootstrap.js'
    ],
    output: {
      dir: 'lib',
      format: 'cjs',
      sourcemap: true,
      manualChunks: {
        db: ['src/common/db.js'],
        image: ['src/image/index.js']
      }
    },
    preserveEntrySignatures: 'strict',
    plugins: [
      emit({
        entries: {
          'views/about': 'src/views/about',
          'views/prefs': 'src/views/prefs',
          'views/print': 'src/views/print',
          'views/project': 'src/views/project',
          'views/wizard': 'src/views/wizard'
        },
        implicitlyLoadedAfterOneOf: [
          'src/bootstrap.js'
        ]
      }),
      natives({
        copyTo: 'lib/node/lib',
        destDir: './node/lib'
      }),
      ignore([
        'node-pre-gyp',
        'pino-pretty',
        'rdf-canonize-native',
        'request'
      ], { commonjsBugFix: true }),
      alias({
        entries: {
          semver: join(
            __dirname, 'node_modules/semver/semver.js'
          )
        }
      }),
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'readable-stream': 'stream'
      }),
      json(),
      babel({ babelHelpers: 'bundled' }),
      commonjs()
    ],
    external: [
      'electron',
      ...builtins
    ]
  },

  {
    output: {
      dir: 'lib/css'
    },
    plugins: [
      scss({
        entries: [
          `src/stylesheets/${platform}`
        ],
        platform,
        themes: [
          'light',
          'dark'
        ]
      })
    ],
    onwarn(warning, warn) {
      if (warning.code !== 'EMPTY_BUNDLE')
        warn(warning)
    }
  }
]
