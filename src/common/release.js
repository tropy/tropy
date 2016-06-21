'use strict'

const { version, author, name, productName } = require('../../package')

module.exports = {

  version,

  author,

  name,

  product: productName,

  channel:
    version.includes('beta') ? 'beta' :
      version.includes('dev') ? 'dev' :
        'stable'

}
