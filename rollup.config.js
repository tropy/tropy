import { join, normalize, relative } from 'path'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import cleanup from 'rollup-plugin-cleanup'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import ignore from 'rollup-plugin-ignore'
import json from '@rollup/plugin-json'
import license from 'rollup-plugin-license'
import natives from 'rollup-plugin-natives'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import sharp from 'sharp/package.json'

// import visualize from 'rollup-plugin-visualizer'

import scss from './scripts/rollup-plugin-scss'
import emit from './scripts/rollup-plugin-emit'
import fsEvents from './scripts/rollup-plugin-fsevents'
import reactDnd from './scripts/rollup-plugin-react-dnd'
import sharpRequire from './scripts/rollup-plugin-sharp'

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
    normalize('src/esper/index.js'),
    normalize('src/components/list/tree.js'),
    normalize('node_modules/n3/src/N3DataFactory.js'),
    normalize('node_modules/semver/classes/comparator.js')
  ].includes(warning.importer),

  THIS_IS_UNDEFINED: (warning) =>
    (/this && this\.__/).test(warning.frame)
}

function onwarn(warning, warn) {
  let ok = IGNORE_WARNINGS[warning.code]

  if (ok === true || typeof ok === 'function' && ok(warning))
    return
  else
    warn(warning)
}

const external = [
  'electron',
  'fs/promises'
]

if (process.platform !== 'darwin')
  external.push('fsevents')


export default [
  {
    input: [
      'src/browser/main.js'
    ],
    output: {
      dir: 'lib/browser',
      format: 'cjs',
      generatedCode: 'es2015',
      sourcemap: false
    },
    preserveEntrySignatures: 'strict',
    plugins: [
      ignore([
        'pino-pretty'
      ], { commonjsBugFix: true }),
      alias({
        entries: {
          depd: join(process.cwd(), 'node_modules/cookies/node_modules/depd')
        }
      }),
      resolve({
        exportConditions: ['node'],
        preferBuiltins: true
      }),
      babel({ babelHelpers: 'bundled' }),
      json(),
      commonjs(),
      license({
        thirdParty: {
          includePrivate: true,
          output: {
            file: 'lib/licenses.browser.json',
            template: JSON.stringify
          }
        }
      }),
      cleanup()
      // visualize({ filename: 'main.html' })
    ],
    external,
    onwarn
  },

  {
    input: {
      bootstrap: 'src/bootstrap.js'
    },
    output: {
      dir: 'lib',
      format: 'cjs',
      generatedCode: 'es2015',
      sourcemap: true
    },
    preserveEntrySignatures: 'strict',
    plugins: [
      emit({
        entries: {
          'esper': 'src/esper/index',
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
      sharpRequire({ platformId }),
      natives({
        copyTo: 'lib/node/lib',
        destDir: './node/lib',
        target_arch: arch
      }),
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
        'pino-pretty',
        'rdf-canonize-native',
        'request',
        'vm',
        'web-streams-polyfill/ponyfill/es2018'
      ], { commonjsBugFix: true }),
      alias({
        entries: {
          semver: join(process.cwd(), 'node_modules/semver')
        }
      }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
          'readable-stream': 'stream'
        }
      }),
      replace({
        preventAssignment: true,
        include: [
          'node_modules/jsonld/lib/documentLoaders/node.js'
        ],
        values: {
          manual: 'follow'
        }
      }),
      resolve({
        exportConditions: ['node'],
        preferBuiltins: true
      }),
      json(),
      fsEvents(),
      reactDnd(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled'
      }),
      commonjs({
        ignoreTryCatch: false,
        requireReturnsDefault: 'preferred'
      }),
      license({
        thirdParty: {
          includePrivate: true,
          output: {
            file: 'lib/licenses.renderer.json',
            template: JSON.stringify
          }
        }
      }),
      cleanup()
      // visualize({ filename: 'renderer.html' })
    ],
    external,
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
