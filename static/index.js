'use strict'

{
  const pkg = require('../package')
  const dom = require('../lib/dom')
  const log = require('../lib/common/log')
  const v = process.versions

  dom.ready(() => {
    log.info('window ready after %sms', Date.now() - global.START_TIME)

    document.body.innerHTML =
      `${pkg.name} ${process.env.NODE_ENV} ${v.electron} / ${v.node}`

  })

  dom.append(
    dom.stylesheet(`../lib/stylesheets/${process.platform}.css`),
    document.head)
}
