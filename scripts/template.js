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

const html = name => (
`<!DOCTYPE html>
<html>
<head>
</head>
<body id="${name}" tabindex="-1">
  <main id="main"></main>
  <div id="popup-root"></div>
  <div id="cover" class="cover"></div>
</body>
</html>`)

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
    .command('new name', 'create new window template', noop, ({ name }) => {
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
    })
    .command('rm name', 'delete window template', noop, ({ name }) => {
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
    })
    .help()
    .argv
}
