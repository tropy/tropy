'use strict'

{
  const dom = require('../lib/dom')
  const log = require('../lib/common/log')

  dom.ready(() => {
    log.info('dummy ready after %sms', Date.now() - global.START_TIME)
  })

  dom.append(
    dom.stylesheet(`../lib/stylesheets/dummy-${process.platform}.css`),
    document.head)
}
