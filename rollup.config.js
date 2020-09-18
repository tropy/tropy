import { join, relative } from 'path'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import builtins from 'builtin-modules'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import ignore from 'rollup-plugin-ignore'
import json from '@rollup/plugin-json'
import natives from 'rollup-plugin-natives'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'

// import visualize from 'rollup-plugin-visualizer'

import scss from './scripts/rollup-plugin-scss'
import emit from './scripts/rollup-plugin-emit'

const NODE_ENV = process.env.NODE_ENV || 'production'
const platform = process.env.TROPY_PLATFORM || process.platform

const IGNORE_WARNINGS = {
  CIRCULAR_DEPENDENCY: (warning) => [
    'src/esper/index.js',
    'src/components/list/tree.js',
    'node_modules/n3/src/N3DataFactory.js'
  ].includes(warning.importer),

  EVAL: (warning) => [
    'node_modules/bluebird/js/release/util.js'
  ].includes(relative(process.cwd(), warning.id)),

  THIS_IS_UNDEFINED: (warning) =>
    (/this && this\.__/).test(warning.frame)
}

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
      copy({
        targets: [
          {
            src: 'node_modules/sharp/vendor/lib',
            dest: 'lib/vendor'
          }
        ],
        copyOnce: true
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
      babel({
        babelHelpers: 'bundled'
      }),
      commonjs({
        requireReturnsDefault: true
      })
    ],
    external: [
      'electron',
      ...builtins
    ],
    onwarn(warning, warn) {
      let ok = IGNORE_WARNINGS[warning.code]

      if (ok === true || typeof ok === 'function' && ok(warning))
        return
      else {
        console.dir(warning)
        warn(warning)
      }
    }
  },

  {
    output: {
      dir: 'lib/css'
    },
    plugins: [
      scss({
        entries: [
          'src/stylesheets/windows'
        ],
        platform
      })
    ],
    onwarn(warning, warn) {
      if (warning.code !== 'EMPTY_BUNDLE')
        warn(warning)
    }
  }
]
