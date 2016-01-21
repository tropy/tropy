'use strict'

{
  const log = require('../lib/common/log')
  const dom = require('../lib/dom')
  const assistant = require('../lib/components/assistant')

  dom.ready(() => {
    log.info('wizard ready after %sms', Date.now() - global.START_TIME)
    assistant.mount(dom.$('main'))
  })
}
