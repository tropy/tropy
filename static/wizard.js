'use strict'

{
  const log = require('../lib/common/log')

  window.onload = () => {
    log.info('wizard ready after %sms', Date.now() - global.START_TIME)
  }
}
