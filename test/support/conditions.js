import { registerHooks } from 'node:module'

// Resolve as the renderer bundle does (see rollup.config.js),
// e.g. #sqlite/transport to the Web Worker transport.
if (process.type === 'renderer') {
  registerHooks({
    resolve (specifier, context, nextResolve) {
      return nextResolve(specifier, {
        ...context,
        conditions: [...context.conditions, 'renderer']
      })
    }
  })
}
