'use strict'

{
  const log = require('../lib/common/log')
  const dom = require('../lib/dom')
  const wizard = require('../lib/components/wizard')

  dom.ready(() => {
    log.info('wizard ready after %sms', Date.now() - global.START_TIME)
    wizard.mount(dom.$('main'))
  })
}
