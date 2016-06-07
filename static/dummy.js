'use strict'

{
  const { ready, $, on, toggle } = require('../lib/dom')

  ready(() => {
    on($('.container'), 'click', function () {
      toggle(this, 'item')
    })
  })

}
