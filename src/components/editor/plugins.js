'use strict'

const { history } = require('prosemirror-history')

const {
  InputRule,
  inputRules,
  smartQuotes,
  ellipsis,
  orderedListRule,
  bulletListRule,
  blockQuoteRule
} = require('prosemirror-inputrules')

const enDash = new InputRule(/--$/, '–')
const enDashAuto = new InputRule(/ - $/, ' – ')

const emDash = new InputRule(/–-$/, '—')

const hrRule = (hr, p) =>
  new InputRule(/^\s*—-$/, (state, match, start, end) =>
    state.tr.replaceRangeWith(start, end, [hr.create(), p.create()])
  )

module.exports = (schema) => {
  const rules = [
    enDash, enDashAuto, emDash, ellipsis, ...smartQuotes
  ]

  if (schema.nodes.blockquote) {
    rules.push(blockQuoteRule(schema.nodes.blockquote))
  }

  if (schema.nodes.ordered_list) {
    rules.push(orderedListRule(schema.nodes.ordered_list))
  }

  if (schema.nodes.bullet_list) {
    rules.push(bulletListRule(schema.nodes.bullet_list))
  }

  if (schema.nodes.horizontal_rule) {
    rules.push(hrRule(schema.nodes.horizontal_rule, schema.nodes.paragraph))
  }

  return [
    history(),
    inputRules({ rules })
  ]
}
