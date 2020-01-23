'use strict'

const subject = require('../subject')
const { ITEM } = require('../constants')


class TemplateChange extends subject.Save {
  type = 'item'
}

TemplateChange.register(ITEM.TEMPLATE.CHANGE)


module.exports = {
  TemplateChange
}
