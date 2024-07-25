import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { transformAsync } from '@babel/core'
import { minimatch } from 'minimatch'

let options
let include

console.log('hooks')

export async function initialize(data) {
  console.log('init', data)
  options = data.config
  include = data.include
}

export async function load(url, context, nextLoad) {
  let { format, source } = await nextLoad(url, context)

  if (format === 'module' || format === 'commonjs') {

    if (url.startsWith('file:')) {
      let path = relative(process.cwd(), fileURLToPath(url))

      if (include.every(pattern => minimatch(path, pattern))) {
        let transformed = await transformAsync(source, options)
        source = transformed.code
      }
    }
  }

  return { format, source }
}
