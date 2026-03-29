import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import { matchesGlob, relative } from 'node:path'
import { transformSync } from '@babel/core'

if (process.type === 'renderer') {
  let root = fileURLToPath(new URL('../..', import.meta.url))

  let globs = [
    'src/{components,views,hooks}/**/*.js',
    'test/components/**/*.js',
    'test/support/react.js'
  ]

  let match = (url) => {
    if (!url.startsWith('file:')) return false
    let path = relative(root, fileURLToPath(url))
    return globs.some(glob => matchesGlob(path, glob))
  }

  let transform = (code, filename) =>
    transformSync(code, {
      filename,
      sourceMaps: 'inline'
    }).code

  registerHooks({
    load (url, context, nextLoad) {
      if (context.format === 'electron') {
        // Returning '' instead null to pass Node's hook validation!
        // Electron injects the source outside of the chain.
        return {
          format: context.format,
          source: '',
          shortCircuit: true
        }
      }
      let result = nextLoad(url, context)

      if (match(url)) {
        return {
          ...result,
          source: transform(result.source, url)
        }
      } else {
        return result
      }
    }
  })
}
