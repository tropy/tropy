#!/usr/bin/env node

'use strict'

const { say, warn } = require('./util')('τ')
const fs = require('fs')
const rimraf = require('rimraf')
const { join } = require('path')

const HOME = join(__dirname, '..')
const PLATFORMS = ['linux', 'darwin', 'win32']
const THEMES = ['light', 'dark']
const noop = () => {}

const rm = path => {
  rimraf.sync(path)
  say(path)
}

const create = (path, content) => {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, content)
    say(path)
  } else {
    warn(`skipping ${path}`)
  }
}

/* eslint-disable max-len */
const html = name => (
`<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="${[
    "default-src 'none'",
    // DevTools Extensions currently require 'unsafe-inline'; adding the
    // digest temporarily to see if that is a stable workaround.
    "script-src 'sha256-++gna1tMQ08GGn4M8jnPXPgLA3Il1y2LY+JVA4NpYKk='",
    "worker-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    'img-src * data:',
    "connect-src 'self' http: https:",
    "form-action 'none'"
  ].join('; ')}">
</head>
<body id="${name}" tabindex="-1">
  <main id="main"></main>
  <div id="popup-root"></div>
  <div id="cover" class="cover">
    <svg class="tropy-icon" xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
      <polygon fill="transparent" points="121.524 49 143.464 11 0.536 11 22.475 49 27.094 49 7.464 15 136.536 15 119.216 45 53 45 53 134.464 91 112.524 91 74.906 87 77.215 87 110.216 57 127.536 57 49 121.524 49"/>
    </svg>
  </div>
</body>
</html>
`)
/* eslint-enable max-len */

const script = () => (
`'use strict'

const React = require('react')
const { render } = require('react-dom')
`)

const stylesheet = (platform, theme) => (
`$platform: "${platform}";
$theme: "${theme}";
`)


if (require.main === module) {
  require('yargs')
    .command('new name', 'create new window template', noop, opts => {
      for (let name of opts.name.split(',')) {
        create(join(HOME, 'res', 'views', `${name}.html`), html(name))
        create(join(HOME, 'src', 'views', `${name}.js`), script(name))

        for (let platform of PLATFORMS) {
          for (let theme of THEMES) {
            create(
              join(
                HOME,
                'src',
                'stylesheets',
                platform,
                `${name}-${theme}.scss`),
              stylesheet(platform, theme))
          }
        }
      }
    })
    .command('rm name', 'delete window template', noop, opts => {
      for (let name of opts.name.split(',')) {
        rm(join(HOME, 'res', 'views', `${name}.html`))
        rm(join(HOME, 'src', 'views', `${name}.js`))

        for (let platform of PLATFORMS) {
          for (let theme of THEMES) {
            rm(
              join(HOME,
                'src',
                'stylesheets',
                platform,
                `${name}-${theme}.scss`))
          }
        }
      }
    })
    .help()
    .argv
}
