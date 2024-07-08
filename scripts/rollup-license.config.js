import { join } from 'node:path'
import config from '../rollup.config.js'
import license from 'rollup-plugin-license'

const addLicensePlugin = (opts, type) => (
  opts.plugins.push(license({
    thirdParty: {
      includePrivate: true,
      output: {
        file: join(import.meta.dirname, `licenses.${type}.json`),
        template: JSON.stringify
      }
    }
  })),
  opts
)

export default [
  addLicensePlugin(config[0], 'main'),
  addLicensePlugin(config[1], 'renderer')
]
