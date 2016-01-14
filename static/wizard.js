'use strict'

{
  const log = require('../lib/common/log')
  const dom = require('../lib/dom')

  dom.ready(() => {
    log.info('wizard ready after %sms', Date.now() - global.START_TIME)
  })
}
