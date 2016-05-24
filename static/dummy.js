'use strict'

{
  const { ready, append, stylesheet, $, on, toggle } = require('../lib/dom')
  const { info } = require('../lib/common/log')

  ready(() => {
    info('dummy ready after %sms', Date.now() - global.START_TIME)
  })

  append(
    stylesheet(`../lib/stylesheets/dummy-${process.platform}.css`),
      document.head)

  on($('.container'), 'click', function () {
    toggle(this, 'item')
  })

  toggle(document.body, 'frameless', !global.args.frame)

}
