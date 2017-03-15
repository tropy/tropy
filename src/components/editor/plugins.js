'use strict'

const { history } = require('prosemirror-history')
const { inputRules, allInputRules } = require('prosemirror-inputrules')

module.exports = {
  plugins: [
    history(),

    inputRules({
      rules: allInputRules
    })

  ]
}
