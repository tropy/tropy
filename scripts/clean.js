'use strict';

require('shelljs/global');

const path = require('path');
const home = path.resolve(__dirname, '..');

rm('-rf', path.join(home, 'lib'));
