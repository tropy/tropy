'use strict'

const { basename } = require('path')
const pkg = require('../../package')
const exe = basename(process.argv[0])

module.exports = require('yargs')
  .usage(`Usage: ${exe} [options]`)
  .strict()
  .wrap(78)

  .option('mode', {
    alias: 'm',
    type: 'string',
    describe: 'Set mode',
    choices: ['debug', 'dev', 'test', 'production']
  })
  .default('mode',
      () => (process.env.NODE_ENV || 'production'), '"production"')

  .help('help')
  .version(pkg.version)

  .epilogue([
    'Environment Variables:',
    '  NODE_ENV  Set default mode'
  ].join('\n'))
