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

      for (let i = 0; i < hotspots.length; ++i) {
        toggle(hotspots[i], 'active', hotspots[i] === node)
      }

      toggle(C, 'item', attr(node, 'data-view') === 'i')
    }

    for (let i = 0; i < hotspots.length; ++i) {
      on(hotspots[i], 'click', function () { activate(this) })
    }

    activate(hotspots[0])

    function shift(event) {
      toggle(document.body, 'shift', event.shiftKey)
    }

    on(window, 'keydown', shift)
    on(window, 'keyup', shift)

  })
}
