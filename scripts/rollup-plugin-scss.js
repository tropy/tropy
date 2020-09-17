import fs from 'fs'
import { basename, dirname, extname, resolve } from 'path'
import { promisify } from 'util'
import sass from 'node-sass'
import SASS from '../src/constants/sass'
import { get } from '../src/common/util'

const render = promisify(sass.render)

const toSass = (value, unit) => {
  if (typeof value === 'number') {
    return new sass.types.Number(value, unit)
  }

  if (typeof value === 'string') {
    return new sass.types.String(value)
  }

  if (value != null && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.reduce((list, val, i) => (
        list.setValue(i, toSass(val, unit)), list
      ), new sass.types.List(value.length))
    }

    let entries = Object.entries(value)
    return entries.reduce((map, [key, val], i) => {
      map.setKey(i, new sass.types.String(key))
      map.setValue(i, toSass(val))
      return map
    }, new sass.types.Map(entries.length))
  }

  return sass.types.Null.NULL
}

export const functions = {
  'const($name, $unit:"")'(name, unit) {
    return toSass(get(SASS, name.getValue()), unit.getValue())
  }
}

export default function ({
  entries,
  extension = '.scss',
  outputStyle = 'compressed'

} = {}) {
  return {
    name: 'sass',

    options() {
    },

    async buildStart() {
      for (let entry of entries) {
        for (let file of await fs.promises.readdir(entry)) {
          if (extname(file) === extension)
            this.emitFile({
              type: 'chunk',
              fileName: file,
              id: [entry, file].join('/')
            })
        }
      }
    },

    async transform(code, id) {
      if (extname(id) !== extension)
        return null

      let outFile = `${basename(id, extension)}.css`

      let includePaths = [
        dirname(id),
        resolve('node_modules')
      ]

      let sourceMapRoot = resolve()

      let { css, map, stats } = await render({
        data: code,
        functions,
        includePaths,
        outFile,
        outputStyle,
        sourceMap: true,
        sourceMapContents: true,
        sourceMapRoot
      })

      if (this.meta.watchMode && stats.includedFiles) {
        for (let file of stats.includedFiles) {
          this.addWatchFile(file)
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: outFile,
        source: css.toString()
      })

      if (map) {
        this.emitFile({
          type: 'asset',
          fileName: `${outFile}.map`,
          source: map.toString()
        })
      }

      return ''
    },

    generateBundle(options, bundle) {
      for (let file in bundle) {
        if (extname(file) === extension)
          delete bundle[file]
      }
    }
  }
}
