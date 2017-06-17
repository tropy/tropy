# Tropy
[![Build Status](https://travis-ci.org/tropy/tropy.svg?branch=master)](https://travis-ci.org/tropy/tropy)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/tropy/tropy?branch=master&svg=true)](https://ci.appveyor.com/project/inukshuk/tropy)
[![Coverage Status](https://coveralls.io/repos/tropy/tropy/badge.svg?branch=master&service=github)](https://coveralls.io/github/tropy/tropy?branch=master)
[![License AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)

Bring order to your research — use the power of Tropy to organize and describe
your research photos so you can quickly find your sources whenever you need them.

Visit [tropy.org](https://tropy.org) to learn more or follow
[@tropy](https://twitter.com/tropy) on Twitter for important announcements.


## Development

Install the latest version of [Node.js](https://nodejs.org) (at least the
version that ships with the current [Electron](https://electron.atom.io)
release) with [`node-gyp`](https://www.npmjs.com/package/node-gyp) and all
its requirements for your platform.

Then clone [this repository](https://github.com/tropy/tropy.git) and run
`npm install` to install all of Tropy's dependencies.

Run `npm test` to run all tests; `npm run test:renderer` or `npm run
test:browser` to run only the Renderer/Browser tests, or `node scripts/make
mocha -- <path>` to run only a given test file.

See `node scripts/make rules` and `node scripts/db rules` for additional
available targets.

Finally, to start [Tropy](https://tropy.org) in development mode, run `npm start`.
