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
version that ships with the current [Electron](https://electronjs.org)
release) with [`node-gyp`](https://www.npmjs.com/package/node-gyp) and all
its requirements for your platform.

On Linux you may need to install some packages in addition to node-gyp's
requirements. For example:

    # On Arch Linux
    $ sudo pacman -Sy fftw orc librsvg

    # On Debian
    $ sudo apt-get install liborc-0.4-0 libfftw3-bin librsvg2-bin
    
    # On CentOS
    $ sudo yum install fftw3 orc librsvg2 glib2-devel

Before installing Tropy's dependencies, set the environment variable
`SHARP_DIST_BASE_URL` or the `sharp_dist_base_url` npm config option to
point to the base URL for Tropy's
[pre-compiled libvips archives](https://github.com/tropy/sharp-libvips/releases/latest):

    $ npm config set sharp_dist_base_url "https://github.com/tropy/sharp-libvips/releases/download/v8.8.1-tropy/"

Additionally, if you have libvips installed locally (and don't wish Tropy
to be linked against it), set the `SHARP_IGNORE_GLOBAL_LIBVIPS` environment
variable.

Finally, clone [this repository](https://github.com/tropy/tropy.git) and install
all of Tropy's dependencies:

    # Install native modules first, without building, them. They will
    # be patched and linked agains Electron by our rebuild script later!
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
