'use strict'

require('shelljs/make')

const { say, warn } = require('./util')('make')
const { existsSync: exists, writeFileSync: write } = require('fs')
const { join, resolve } = require('path')

const home = resolve(__dirname, '..')

target.window = ([name]) => {
  template(join(home, 'static', `${name}.html`),
`<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="${[
    "default-src 'unsafe-inline'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')}">
</head>
<body id="${name}" tabindex="-1">
  <main></main>
  <div id="popup-root"></div>
</body>
</html>`)

  template(join(home, 'src', 'windows', `${name}.js`), "'use strict'\n")

  const PLATFORMS = ['linux', 'darwin', 'win32']
  const THEMES = ['light', 'dark']

  for (let platform of PLATFORMS) {
    for (let theme of THEMES) {
      template(
        join(home, 'src', 'stylesheets', platform, `${name}-${theme}.scss`),
        `$platform: "${platform}";\n$theme: "${theme}";\n`
      )
    }
  }
}

function template(path, content) {
  if (!exists(path)) {
    write(path, content)
    say(path)
  } else {
    warn(path)
  }
}
