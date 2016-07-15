'use strict'

const { basename } = require('path')
const pkg = require('../../package')
const exe = basename(process.argv[0])

module.exports = require('yargs')
  .usage(`Usage: ${exe} [options]`)
  .strict()
  .wrap(78)
  .env(pkg.name.toUpperCase())

  .option('environment', {
    alias: 'e',
    type: 'string',
    describe: 'Set environment',
    choices: ['development', 'test', 'production']
  })
  .default('environment',
      () => (process.env.NODE_ENV || 'production'), '"production"')

  .option('debug', {
    type: 'boolean',
    describe: 'Set debug flag'
  })
  .default('debug', () => (process.env.DEBUG || 'false'), 'false')

  .help('help')
  .version(pkg.version)

  .epilogue([
    'Environment Variables:',
    '  DEBUG     Set debug mode default',
    '  NODE_ENV  Set default environment'
  ].join('\n'))
