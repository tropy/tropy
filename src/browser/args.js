import { resolve } from 'path'
import { exe, version } from '../common/release'
import { Command } from 'commander'

export const program = new Command()

const type = {
  path(value) { return resolve(value) },
  float(value) { return parseFloat(value) },
  int(value) { return parseInt(value, 10) }
}

program
  .name(exe)
  .arguments('[project]')
  .version(version)

  // TODO remove when squirrel is not used anymore!
  .allowUnknownOption()

  .option('--data <path>', 'set data directory', type.path)
  .option('--cache <path>', 'set cache directory', type.path)
  .option('--logs <path>', 'set log directory', type.path)

  // TODO will be obsolete with bundling!
  .option('--env <name>', 'set environment',
    process.env.NODE_ENV || 'production')
  .option('--app <path>', 'reserved for internal development')

  .option('--scale <factor>', 'set the device scale factor', type.float)

  .option('--no-auto-updates', 'automatically check for updates')
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
  }
}
