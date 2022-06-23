import { resolve } from 'node:path'
import { URL, pathToFileURL } from 'node:url'
import { exe, version } from '../common/release.js'
import { Command } from 'commander'

export const program = new Command()

const type = {
  path(value) { return resolve(value) },
  float(value) { return parseFloat(value) },
  int(value) { return parseInt(value, 10) }
}

program
  .name(exe)
  .arguments('[args]')
  .version(version)

  // TODO remove when squirrel is not used anymore!
  .allowUnknownOption()

  .option('--data <path>', 'set data directory', type.path)
  .option('--cache <path>', 'set cache directory', type.path)
  .option('--logs <path>', 'set log directory', type.path)
  .option('--extensions <path>', 'set chromium extensions directory', type.path)

  // TODO will be obsolete with bundling!
  .option('--env <name>', 'set environment',
    process.env.NODE_ENV || 'production')
  .option('--app <path>', 'reserved for internal development')

  .option('--scale <factor>', 'set the device scale factor', type.float)

  .option('--no-auto-updates', 'disable automatic updates')
  .option('--no-context-isolation', 'disable context isolation')
  .option('--webgl', 'prefer WebGL even on GPUs with known issues', false)

  .option('--debug', 'set debug flag', !!process.env.TROPY_DEBUG)
  .option('--trace', 'set trace flag', !!process.env.TROPY_TRACE)

  .option('-p, --port <number>', 'set API listening port', type.int)


export function parse(argv = process.argv.slice(1)) {
  program.parse(argv, { from: 'user' })

  return {
    opts: program.opts(),
    args: program.args
      // TODO remove with allowUnknownOption!
      .filter(arg => !arg.startsWith('-'))
      .map(arg => argToURL(arg))

  }
}

export function argToURL(arg, cwd = process.cwd()) {
  // Subtle: only try to parse arguments as URLs for supported protocols,
  // otherwise win32 paths with drive letters may get interpreted as URLs.
  if (!(/^(tropy|file|https?):/i).test(arg))
    return pathToFileURL(resolve(cwd, arg))

  try {
    return new URL(arg)

  } catch (e) {
    if (e.code !== 'ERR_INVALID_URL')
      throw e

    return pathToFileURL(resolve(cwd, arg))
  }
}
