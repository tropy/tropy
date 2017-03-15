'use strict'

const { history } = require('prosemirror-history')
const {
  inputRules, allInputRules, orderedListRule, bulletListRule, blockQuoteRule
} = require('prosemirror-inputrules')

module.exports = (schema) => {
  const rules = [...allInputRules]

  if (schema.nodes.blockquote) {
    rules.push(blockQuoteRule(schema.nodes.blockquote))
  }

  if (schema.nodes.ordered_list) {
    rules.push(orderedListRule(schema.nodes.ordered_list))
  }

  if (schema.nodes.bullet_list) {
    rules.push(bulletListRule(schema.nodes.bullet_list))
  }

  return [
    history(),
    inputRules({ rules })
  ]
}
