# Tropy
[![Build Status](https://travis-ci.org/tropy/tropy.svg?branch=master)](https://travis-ci.org/tropy/tropy)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/tropy/tropy?branch=master&svg=true)](https://ci.appveyor.com/project/inukshuk/tropy)
[![Coverage Status](https://coveralls.io/repos/tropy/tropy/badge.svg?branch=master&service=github)](https://coveralls.io/github/tropy/tropy?branch=master)

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
version that ships with the current [Electron](https://electronjs.org)
release) and all requirements needed to use
[`node-gyp`](https://www.npmjs.com/package/node-gyp) on your platform.

Finally, clone [this repository](https://github.com/tropy/tropy.git) and
install all of Tropy's dependencies:

    # Install native modules first, without building, them. They will
    # be patched and linked against Electron by our rebuild script later!
    $ npm install sharp sqlite3 --ignore-scripts --no-save --no-package-lock
    $ npm install

To test that everything is set up correctly, run:

    $ npm test

## Creating Builds
To create a dev-build for your current platform run `npm run build` at the
root of the repository. This will create a dev-build of Tropy in the `dist`
folder.

## Running in Dev-Mode
Alternatively, you can start Tropy in dev-mode directly from the root of the
repository, by running `npm start`.
