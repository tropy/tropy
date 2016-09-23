'use strict'

const LIST = require('../constants/list')
const List = require('./list')

module.exports = {

  [LIST.CREATE]: List.Create,

  handle(action, options) {
    return new module.exports[action.type](action, options)
  }
}
