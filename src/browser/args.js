'use strict'

const { resolve } = require('path')
const { exe, version } = require('../common/release')
const yargs = require('yargs')()

module.exports =
  yargs
    .parserConfiguration({
      'camel-case-expansion': false,
      'short-option-groups': false
    })

    .usage(`Usage: ${exe} [options] [project]`)
    .wrap(process.stdout.columns ? Math.min(process.stdout.columns, 80) : 80)
    .env('TROPY')

    .demand(0, 1)

    .option('data', {
      type: 'string',
      coerce: resolve,
      describe: 'Set data directory'
    })
    .option('cache', {
      type: 'string',
      coerce: resolve,
      describe: 'Set cache directory'
    })
    .option('logs', {
      type: 'string',
      coerce: resolve,
      describe: 'Set log directory'
    })

    .option('environment', {
      alias: 'env',
      type: 'string',
      describe: 'Set environment',
      choices: ['development', 'test', 'production']
    })
    .default('environment',
      () => (process.env.NODE_ENV || 'production'),
      '"production"')

    .option('scale', {
      type: 'number',
      describe: 'Set the device scale factor'
    })

    .option('auto-updates', {
      type: 'boolean',
      describe: 'Automatically check for updates',
      default: true
    })

    .option('ignore-gpu-blacklist', {
      type: 'boolean',
      describe: 'Do not blacklist certain GPUs known to cause issues',
      default: false
    })

    .option('debug', {
      type: 'boolean',
      describe: 'Set debug flag',
      default: false
    })

    .option('trace', {
      type: 'boolean',
      describe: 'Set trace flag',
      default: false
    })

    .option('port', {
      alias: 'p',
      type: 'number',
      describe: 'Set API listening port',
      default: null
    })

    .help('help')
    .version(version)

    .epilogue([
      'Environment Variables:',
      '  NODE_ENV  Set default environment'
    ].join('\n'))
