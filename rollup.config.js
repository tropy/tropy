import { join, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import ignore from 'rollup-plugin-ignore'
import json from '@rollup/plugin-json'
import license from 'rollup-plugin-license'
import natives from 'rollup-plugin-natives'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'

// import visualize from 'rollup-plugin-visualizer'

import scss from './scripts/rollup-plugin-scss.js'
import emit from './scripts/rollup-plugin-emit.js'
import createFile from './scripts/rollup-plugin-create-file.js'
import reactDnd from './scripts/rollup-plugin-react-dnd.js'
import sharpRequire from './scripts/rollup-plugin-sharp.js'

const sharp = JSON.parse(
  readFileSync('node_modules/sharp/package.json', { encoding: 'utf-8' })
)

const NODE_ENV = process.env.NODE_ENV || 'production'

const platform =
  process.env.npm_config_target_platform ||
  process.env.npm_config_platform ||
  process.platform
const arch =
  process.env.npm_config_target_arch ||
  process.env.npm_config_arch ||
  process.arch

const platformId = (arch === 'arm64') ?
  `${platform}-arm64v8` :
  `${platform}-${arch}`


const IGNORE_WARNINGS = {
  CIRCULAR_DEPENDENCY: (warning) => [
    resolve('src/components/button.js'),
    resolve('src/components/list/tree.js'),
    resolve('node_modules/n3/src/N3DataFactory.js'),
    resolve('node_modules/undici/lib/fetch/util.js')
  ].some(id => warning.ids.includes(id)),

  THIS_IS_UNDEFINED: (warning) =>
    (/this && this\.__/).test(warning.frame)
}

function onwarn(warning, warn) {
  let ok = IGNORE_WARNINGS[warning.code]

  if (ok === true || (typeof ok === 'function' && ok(warning)))
    return
  else
    warn(warning)
}

let ignoreTryCatch = false

if (process.platform !== 'darwin') {
  ignoreTryCatch = (id) => {
    if (id === 'fsevents')
      return 'remove'

    return false
  }
}


export default [
  {
    input: [
      'src/main/index.js'
    ],
    output: {
      dir: 'lib/main',
      format: 'es',
      generatedCode: 'es2015',
      sourcemap: false
    },
    treeshake: 'safest',
    preserveEntrySignatures: 'allow-extension',
    plugins: [
      alias({
        entries: {
          'depd': join(process.cwd(), 'node_modules/depd'),
          'readable-stream': 'stream'
        }
      }),
      nodeResolve({
        exportConditions: ['node'],
        preferBuiltins: true
      }),
      replace({
        preventAssignment: true,
        values: {
          __filename: 'import.meta.filename'
        }
      }),
      json(),
      commonjs({
        ignoreGlobal: true,
        ignoreTryCatch
      }),
      license({
        thirdParty: {
          includePrivate: true,
          output: {
            file: 'lib/licenses.main.json',
            template: JSON.stringify
          }
        }
      })
      // visualize({ filename: 'main.html' })
    ],
    external: [
      'electron'
    ],
    onwarn
  },

  {
    input: {
      bootstrap: 'src/bootstrap.js'
    },
    output: {
      dir: 'lib',
      entryFileNames: '[name].mjs',
      format: 'es',
      generatedCode: 'es2015',
      sourcemap: true
    },
    treeshake: 'safest',
    preserveEntrySignatures: 'allow-extension',
    plugins: [
      createFile({
        fileName: 'package.json',
        source: JSON.stringify({
          name: 'tropy',
          private: true,
          type: 'module'
        })
      }),
      emit({
        entries: {
          'views/about': 'src/views/about.js',
          'views/prefs': 'src/views/prefs.js',
          'views/print': 'src/views/print.js',
          'views/project': 'src/views/project.js'
        },
        implicitlyLoadedAfterOneOf: [
          'src/bootstrap.js'
        ]
      }),
      sharpRequire({ platformId }),
      natives({
        copyTo: 'lib/node/lib',
        destDir: './node/lib',
        target_arch: arch,
        targetEsm: true
      }),
      {
        buildEnd() {
          delete process.__signal_exit_emitter__
        }
      },
      copy({
        targets: [
          (platform === 'win32') ? {
            src: 'node_modules/sharp/build/Release/*.{dll,exp,iobj,ipdb,pdb}',
            dest: 'lib/node/lib'
          } : {
            src: `node_modules/sharp/vendor/${sharp.config.libvips}/${platformId}/lib`,
            dest: `lib/vendor/${sharp.config.libvips}/${platformId}`
          },
          {
            src: `node_modules/sharp/vendor/${sharp.config.libvips}/${platformId}/THIRD-PARTY-NOTICES.json`,
            dest: 'lib',
            rename: 'licenses.libvips.json'
          }
        ],
        copyOnce: true
      }),
      ignore([
        '@mapbox/node-pre-gyp',
        'rdf-canonize-native'
      ], { commonjsBugFix: true }),
      alias({
        entries: {
          'ky-universal': 'ky',
          'readable-stream': 'node:stream'
        }
      }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
        }
      }),
      // PATCH jsonld documentLoader redirect handling
      replace({
        preventAssignment: true,
        include: [
          'node_modules/jsonld/lib/documentLoaders/node.js'
        ],
        values: {
          manual: 'follow'
        }
      }),
      nodeResolve({
        exportConditions: ['node'],
        preferBuiltins: true
      }),
      json(),
      reactDnd(),
      babel({
        include: 'src/{components,views}/**',
        babelHelpers: 'bundled'
      }),
      commonjs({
        ignoreGlobal: true,
        ignoreTryCatch
      }),
      license({
        thirdParty: {
          includePrivate: true,
          output: {
            file: 'lib/licenses.renderer.json',
            template: JSON.stringify
          }
        }
      })
      // visualize({ filename: 'renderer.html' })
    ],
    external: [
      'electron'
    ],
    onwarn
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
