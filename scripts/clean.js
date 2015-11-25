'use strict';

require('shelljs/global');

const path = require('path');
const home = path.resolve(__dirname, '..');

function clean() {
  rm('-rf', path.join(home, 'lib'));
  rm('-rf', path.join(home, 'dist'));
}

module.exports = clean;

clean();
