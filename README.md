Tropy
=====
[![Build Status](https://github.com/tropy/tropy/actions/workflows/ci.yml/badge.svg)](https://github.com/tropy/tropy/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/tropy/tropy/badge.svg?branch=master)](https://coveralls.io/github/tropy/tropy)

Bring order to your research —
use the power of Tropy to organize and describe your research photos
so you can find your sources whenever you need them.

Visit [tropy.org][] to learn more
or follow [@tropy@fosstodon.org][] for important announcements.
To get started, download the latest version of Tropy for your platform,
check out the [user's manual][docs] and join the discussion on the [forums][].

Interested to work on Tropy or create your own builds?
Please find more details below.
Happy hacking!

[tropy.org]: https://tropy.org
[@tropy@fosstodon.org]: https://fosstodon.org/@tropy
[docs]: https://docs.tropy.org
[forums]: https://forums.tropy.org

Installation
------------
Visit [tropy.org][] or the [release page][]
to download the latest version of Tropy.

You can also install Tropy via [Homebrew][], [winget][], or the [AUR][].

[release page]: https://github.com/tropy/tropy/releases/latest
[Homebrew]: https://brew.sh
[winget]: https://winget.run
[AUR]: https://aur.archlinux.org


Installation from Source
------------------------
Install the latest version of [Node.js][]
(at least the version that ships with the current [Electron][] release)
and all dependencies required to use [node-gyp][] on your platform.

Clone this [repository][] and install Tropy's dependencies:

    $ npm install
    $ npm run rebuild -- --force

To test that everything works, run:

    $ npm test

[Node.js]: https://nodejs.org
[Electron]: https://electronjs.org
[node-gyp]: https://www.npmjs.com/package/node-gyp
[repository]: https://github.com/tropy/tropy

Creating Builds
---------------
To create a dev-build for your current platform run `npm run build`.
This will create a dev-build of Tropy in the `dist` folder.

Tropy Development
-----------------
Start Tropy in dev-mode by running `npm start`.

Plugin Development
------------------
You can extend Tropy's functionality via plugins.
To find out more, consult the [plugin specification][]
and clone the [sample plugin][] to get started.

[sample plugin]: https://github.com/tropy/tropy-plugin-example
[plugin specification]: https://github.com/tropy/tropy/blob/master/res/plugins/README.md
