'use strict'

const { version, author, name, productName } = require('../../package')
const { titlecase } = require('./util')
const { platform } = process

const channel =
  version.includes('beta') ? 'beta' :
    version.includes('dev') ? 'dev' :
      'stable'

module.exports = {
  version,
  author,
  name,
  product: productName,
  channel,

  qualified: {
    product: (channel === 'stable') ?
      productName : `${productName} ${titlecase(channel)}`,

    name: (channel === 'stable') ? name : `${name}-${channel}`
  },

  feed: (platform === 'win32') ?
    `https://tropy.org/update/${channel}/${platform}` :
    `https://tropy.org/update/${channel}/${platform}/${version}`
}
