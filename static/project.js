'use strict'

{
  const { name } = require('../package')
  const { ready, html } = require('../lib/dom')
  const v = process.versions

  ready(() => {
    html(document.body,
      `${name} ${process.env.NODE_ENV} ${v.electron} / ${v.node}`)
  })
}
