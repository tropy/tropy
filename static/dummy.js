'use strict'

{
  const { ready, append, stylesheet, $, on, toggle } = require('../lib/dom')
  const { info } = require('../lib/common/log')
  const { release } = require('os')

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

  if (process.platform === 'darwin' && release() > '10.10') {
    toggle(document.body, 'hidden-inset', true)
  }
}
