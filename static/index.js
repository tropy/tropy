'use strict'

{
  const pkg = require('../package')
  const dom = require('../lib/dom')
  const log = require('../lib/common/log')(global.home)

  window.onload = () => {
    log.info('load')
    document.body.innerHTML =
      `${pkg.name} ${pkg.version} ${process.env.NODE_ENV}`

  }

  dom.append(
    dom.stylesheet(`../lib/stylesheets/${process.platform}.css`),
    document.head)
}
