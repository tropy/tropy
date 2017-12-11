'use strict'

const { basename } = require('path')
const pkg = require('../../package')
const exe = basename(process.argv[0])

module.exports = require('yargs')
  .usage(`Usage: ${exe} [options]`)
  .wrap(78)
  .env(pkg.name.toUpperCase())

  .demand(0, 1)

  .option('dir', {
    type: 'string',
    normalize: true,
    describe: 'Set user data directory'
  })

  .option('environment', {
    alias: 'env',
    type: 'string',
    describe: 'Set environment',
    choices: ['development', 'test', 'production']
  })
  .default('environment',
      () => (process.env.NODE_ENV || 'production'), '"production"')

  .option('scale', {
    alias: 'force-device-scale-factor',
    type: 'number',
    describe: 'Set the device scale factor'
  })

  .option('auto-updates', {
    type: 'boolean',
    describe: 'Automatically check for updates',
    default: true
  })

  .option('debug', {
    type: 'boolean',
    describe: 'Set debug flag',
    default: false
  })

  .help('help')
  .version(pkg.version)

  .epilogue([
    'Environment Variables:',
    '  NODE_ENV  Set default environment'
  ].join('\n'))
