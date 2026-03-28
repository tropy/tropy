import { registerHooks } from 'node:module'
import { transformSync } from '@babel/core'

if (process.type === 'renderer') {
  let match = (url) =>
    !(/node_modules/.test(url)) && (
      /[/\\]src[/\\](components|hooks|views)[/\\]/.test(url) ||
      /[/\\]test[/\\]components[/\\]/.test(url) ||
      /[/\\]test[/\\]support[/\\].*\.cjs$/.test(url)
    )

  let transform = (code, filename) =>
    transformSync(code, {
      filename,
      configFile: false,
      babelrc: false,
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        ['@babel/plugin-transform-modules-commonjs']
      ],
      targets: {
        node: '24.14'
      },
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
          format: 'commonjs',
          source: transform(result.source, url)
        }
      } else {
        return result
      }
    }
  })
}
