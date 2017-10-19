# Tropy
[![Build Status](https://travis-ci.org/tropy/tropy.svg?branch=master)](https://travis-ci.org/tropy/tropy)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/tropy/tropy?branch=master&svg=true)](https://ci.appveyor.com/project/inukshuk/tropy)
[![Coverage Status](https://coveralls.io/repos/tropy/tropy/badge.svg?branch=master&service=github)](https://coveralls.io/github/tropy/tropy?branch=master)
[![License AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)

Bring order to your research — use the power of Tropy to organize and describe
your research photos so you can quickly find your sources whenever you need them.

Visit [tropy.org](https://tropy.org) to learn more or follow
[@tropy](https://twitter.com/tropy) on Twitter for important announcements.
To get started, download the latest version of Tropy for your platform, check
out the [user's manual](https://docs.tropy.org) and join the discussion on the
[forums](https://forums.tropy.org).

If you are interested to work on Tropy or create your own builds, please
find more details below. Happy hacking!


## Install from Source
Install the latest version of [Node.js](https://nodejs.org) (at least the
version that ships with the current [Electron](https://electron.atom.io)
release) with [`node-gyp`](https://www.npmjs.com/package/node-gyp) and all
its requirements for your platform.

Then clone [this repository](https://github.com/tropy/tropy.git) and run
`npm install` to install all of Tropy's dependencies.

## Creating Builds
To create a dev build for your current platform run the following scripts
in order at the root of the repository:

```bash
node scripts/make clean
node scripts/make compile
node scripts/build
```

This will create a dev build of Tropy in the `dist` folder.

## Running in Dev Mode
Alternatively, you can start Tropy in dev mode directly in the
repository, by running `npm start`.
