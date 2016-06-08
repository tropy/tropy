'use strict'

{
  const { name } = require('../package')
  const { ready, append, text, element  } = require('../lib/dom')
  const v = process.versions

  ready(() => {
    let node = element('div')

    text(node,
      `${name} ${process.env.NODE_ENV} ${v.electron} / ${v.node}`)

    append(node, document.body)
  })
}
