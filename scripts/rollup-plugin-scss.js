import fs from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as sass from 'sass'
import { OrderedMap } from 'immutable'
import SASS from '../src/constants/sass.js'
import { get } from '../src/common/util.js'

const toSass = (value, unit) => {
  if (typeof value === 'number') {
    return new sass.SassNumber(value, unit)
  }

  if (typeof value === 'string') {
    return new sass.SassString(value)
  }

  if (value != null && typeof value === 'object') {
    if (Array.isArray(value)) {
      return new sass.SassList(value.map(val => toSass(val, unit)))
    }

    let entries = Object.entries(value)
    return new sass.SassMap(entries.reduce((map, [key, val]) => (
      map.set(new sass.SassString(key), toSass(val))
    ), new OrderedMap()))
  }

  return sass.sassNull
}

export const functions = {
  'const($name, $unit:null)'(args) {
    let name = args[0].assertString('name').text
    let unit = args[1].equals(sass.sassNull) ?
      null :
      args[1].assertString('unit').text

    return toSass(get(SASS, name), unit)
  }
}

export default function ({
  entries,
  extension = '.scss',
  style = 'compressed',
  platform,
  themes = ['light', 'dark'],
  skipThemes

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

      let loadPaths = [
        resolve('node_modules')
      ]

      let outFiles = []

      if (skipThemes === true || skipThemes?.(id)) {
        let data = code.replace('"linux"', `"${platform}"`)
        outFiles.push([`${basename(id, extension)}.css`, data])

      } else {
        for (let theme of themes) {
          let data = code
            .replace('"linux"', `"${platform}"`)
            .replace('"../themes/light"', `"../themes/${theme}"`)

          outFiles.push([`${basename(id, extension)}-${theme}.css`, data])
        }
      }

      for (let [outFile, data] of outFiles) {
        let { css, sourceMap, loadedUrls } = sass.compileString(data, {
          url: pathToFileURL(id),
          functions,
          loadPaths,
          style,
          silenceDeprecations: [
            'mixed-decls'
          ],
          sourceMap: true,
          sourceMapIncludeSources: false
        })

        if (this.meta.watchMode && loadedUrls) {
          for (let url of loadedUrls) {
            this.addWatchFile(fileURLToPath(url))
          }
        }

        if (sourceMap) {
          let fileName = `${outFile}.map`
          css += `\n/*# sourceMappingURL=${basename(fileName)} */`

          this.emitFile({
            type: 'asset',
            fileName,
            source: JSON.stringify(sourceMap)
          })
        }

        this.emitFile({
          type: 'asset',
          fileName: outFile,
          source: css
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
