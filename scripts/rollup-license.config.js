import { join } from 'path'
import config from '../rollup.config'
import license from 'rollup-plugin-license'

const addLicensePlugin = (opts, type) => (
  opts.plugins.push(license({
    thirdParty: {
      includePrivate: true,
      output: {
        file: join(__dirname, `licenses.${type}.json`),
        template: JSON.stringify
      }
    }
  })),
  opts
)

export default [
  addLicensePlugin(config[0], 'browser'),
  addLicensePlugin(config[1], 'renderer')
]
