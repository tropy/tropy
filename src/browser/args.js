'use strict';

const { basename } = require('path');
const pkg = require('../../package');

const exe = basename(process.argv[0]);
const NAME = pkg.name.toUpperCase();


module.exports = require('yargs')
  .usage(`Usage: ${exe} [options]`)
  .strict()
  .wrap(78)

  .option('mode', {
    alias: 'm',
    type: 'string',
    describe: 'Set mode',
    choices: ['debug', 'dev', 'test', 'normal']
  })
  .default('mode', defaultmode, '"normal"')

  .help('help')
  .version(pkg.version)

  .epilogue([
    'Environment Variables:',
    `  ${NAME}_MODE  Set default mode`
  ].join('\n'));


function defaultmode() {
  return process.env[`${NAME}_MODE`] || 'normal';
}
