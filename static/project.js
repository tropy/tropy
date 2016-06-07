'use strict'

{
  const { name } = require('../package')
  const { ready } = require('../lib/dom')
  const v = process.versions

  ready(() => {
    document.body.innerHTML =
      `${name} ${process.env.NODE_ENV} ${v.electron} / ${v.node}`

  })
}
