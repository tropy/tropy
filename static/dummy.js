'use strict'

{
  const { ready, $, attr, on, toggle } = require('../lib/dom')

  ready(() => {

    const C = $('.container')
    const P = $('#p')
    const I = $('#i')

    const hotspots = $('.hotspots').children

    function activate(node) {

      P.src = `assets/images/dummy/p-${attr(node, 'data-p')}.png`
      I.src = `assets/images/dummy/i-${attr(node, 'data-i')}.png`

      for (let hs of hotspots) {
        toggle(hs, 'active', hs === node)
      }

      toggle(C, 'item', attr(node, 'data-view') === 'i')
    }

    for (let hs of hotspots) {
      on(hs, 'click', function () { activate(this) })
    }

    activate(hotspots[0])

  })
}
