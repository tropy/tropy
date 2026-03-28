import { registerHooks } from 'node:module'
import { transformSync } from '@babel/core'

if (process.type === 'renderer') {
  let match = (url) =>
    !(/node_modules/.test(url)) && (
      /[/\\]src[/\\](components|hooks|views)[/\\]/.test(url) ||
      /[/\\]test[/\\]components[/\\]/.test(url) ||
      /[/\\]test[/\\]support[/\\]react\.js$/.test(url)
    )

  let transform = (code, filename) =>
    transformSync(code, {
      filename,
      sourceMaps: 'inline'
    }).code

  registerHooks({
    load(url, context, nextLoad) {
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
