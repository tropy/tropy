import { join, resolve } from 'node:path'
import { builtinModules } from 'node:module'
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
import reactDnd from './scripts/rollup-plugin-react-dnd.js'
import sharpRequire from './scripts/rollup-plugin-sharp.js'

const NODE_ENV = process.env.NODE_ENV || 'production'

const { platform } = process
const arch =
  process.env.npm_config_arch ||
  process.env.npm_package_config_node_gyp_arch ||
  process.arch

const platformId = `${platform}-${arch}`
const libvips = []

if (process.env.SHARP_FORCE_GLOBAL_LIBVIPS !== 'true') {
  libvips.push(
    (platform === 'win32') ? {
      src: 'node_modules/sharp/src/build/Release/*.{dll,exp,iobj,ipdb,pdb}',
      dest: 'lib/node/lib'
    } : {
      src: `node_modules/@img/sharp-libvips-${platformId}/lib`,
      dest: `lib/sharp-libvips-${platformId}`
    },
    {
      src: 'vendor/sharp/THIRD-PARTY-NOTICES.json',
      dest: 'lib',
      rename: 'licenses.libvips.json'
    })
}

const IGNORE_WARNINGS = {
  CIRCULAR_DEPENDENCY: (warning) => [
    resolve('src/components/button.js'),
    resolve('src/components/list/tree.js'),
    resolve('node_modules/edtf/src/date.js'),
    resolve('node_modules/n3/src/N3DataFactory.js'),
    resolve('node_modules/semver/classes/range.js'),
    resolve('node_modules/undici/lib/fetch/util.js')
  ].some(id => warning.ids.includes(id)),

  UNUSED_EXTERNAL_IMPORT: true,

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

function ignoreTryCatch(id) {
  if (id === 'fsevents')
    return (process.platform === 'darwin') ? false : 'remove'

  if (id.startsWith('node:') || builtinModules.includes(id))
    return true

  if (id === '@img/sharp-wasm32/versions')
    return 'remove'

  console.warn(`Removing try/catch require of: ${id}`)
  return 'remove'
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
        targets: libvips,
        copyOnce: true
      }),
      ignore([
        '@mapbox/node-pre-gyp',
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
      replace({
        preventAssignment: true,
        values: {
          __dirname: 'import.meta.dirname',
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
        requireReturnsDefault: 'auto',
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
