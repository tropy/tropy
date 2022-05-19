# Tropy
[![Build Status](https://github.com/tropy/tropy/actions/workflows/ci.yml/badge.svg)](https://github.com/tropy/tropy/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/tropy/tropy/badge.svg?branch=master)](https://coveralls.io/github/tropy/tropy)

Bring order to your research —
use the power of Tropy to organize and describe your research photos
so you can quickly find your sources whenever you need them.

Visit [tropy.org][] to learn more
or follow [@tropy][] on Twitter for important announcements.
To get started, download the latest version of Tropy for your platform,
check out the [user's manual][] and join the discussion on the [forums][].

If you are interested to work on Tropy or create your own builds,
please find more details below.
Happy hacking!

[tropy.org]: https://tropy.org
[@tropy]: https://twitter.com.tropy
[users'manual]: https://docs.tropy.org
[forums]: https://forums.tropy.org

Install from Source
-------------------
Install the latest version of [Node.js][]
(at least the version that ships with the current [Electron][] release)
and all requirements needed to use [node-gyp][] on your platform.

Finally, clone this [repository][] and install all of Tropy's dependencies:

    $ npm install
    $ npm run rebuild -- --force

To test that everything is set up correctly, run:

    $ npm test

[Node.js]: https://nodejs.org
[Electron]: https://electronjs.org
[node-gyp]: https://www.npmjs.com/package/node-gyp
[repository]: https://github.com/tropy/tropy

Creating Builds
---------------
To create a dev-build for your current platform run `npm run build`.
This will create a dev-build of Tropy in the `dist` folder.

Running in Dev-Mode
-------------------
Alternatively, you can start Tropy in dev-mode by running `npm start`.

Plugin Development
------------------
Tropy can also be extended via plugins.
To find out more, consult the [plugin specification][]
and clone our [sample plugin][] to get started.

[sample plugin]: https://github.com/tropy/tropy-plugin-example
[plugin specification]: https://github.com/tropy/tropy/blob/master/res/plugins/README.md
