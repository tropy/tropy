import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { URL, pathToFileURL } from 'node:url'
import { authUrl } from '../common/release.js'


const options = {
  data: { type: 'string' },
  cache: { type: 'string' },
  logs: { type: 'string' },
  extensions: { type: 'string' },
  auth: { type: 'string', default: authUrl },
  
  // TODO will be obsolete with bundling!
  env: { type: 'string', default: process.env.NODE_ENV || 'production' },
  app: { type: 'string' },
  
  scale: { type: 'string' },

  'auto-updates': { type: 'boolean', default: true },
  'context-isolation': { type: 'boolean', default: true },

  'renderer-preference': { type: 'string', short: 'R' },

  'disable-hardware-acceleration': { type: 'boolean', default: !!process.env.TROPY_DISABLE_HARDWARE_ACCELERATION },
  
  verbose: { type: 'boolean', default: !!process.env.TROPY_DEBUG },
  trace: { type: 'boolean', default: !!process.env.TROPY_TRACE },
  port: { type: 'string', short: 'p' }
}

export function parse (argv = process.argv.slice(1)) {  
  const { values, positionals } = parseArgs({ 
    args: argv, 
    options, 
    strict: false, // TODO remove when squirrel is not used anymore!
    allowNegative: true, 
    allowPositionals: true, 
  })

  if (values.data != null) values.data = resolve(values.data)
  if (values.cache != null) values.cache = resolve(values.cache)
  if (values.logs != null) values.logs = resolve(values.logs)
  if (values.extensions != null) values.extensions = resolve(values.extensions)
  if (values.scale != null) values.scale = parseFloat(values.scale)
  if (values.port != null) values.port = parseInt(values.port, 10)

  const opts = {
    autoUpdates: values['auto-updates'],
    contextIsolation: values['context-isolation'],
    rendererPreference: values['renderer-preference'],
    disableHardwareAcceleration: values['disable-hardware-acceleration'],
    ...values
  }
  
  return {
    opts,
    args: positionals
      // TODO remove with strict:false!
      .filter(arg => !(
        arg.startsWith('-') ||
        arg.startsWith('data:') ||
        arg.trim().length === 0))
      .map(arg => argToURL(arg.trim()))
  }
}

export function argToURL (arg, cwd = process.cwd()) {
  // Subtle: only try to parse arguments as URLs for supported protocols,
  // otherwise win32 paths with drive letters may get interpreted as URLs.
  if (!(/^(tropy|file|https?):/i).test(arg))
    return pathToFileURL(resolve(cwd, arg))

  try {
    return new URL(arg)

  } catch (err) {
    if (err.code !== 'ERR_INVALID_URL')
      throw err

    return pathToFileURL(resolve(cwd, arg))
  }
}
