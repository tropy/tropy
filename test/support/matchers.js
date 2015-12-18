'use strict'

module.exports = {
  string: function (chai, utils) {

    function starts(prefix) {
      const str = utils.flag(this, 'object')

      return this.assert(
        str.startsWith(prefix),
        `expected ${str} to start with ${prefix}`,
        `expected ${str} not to start with ${prefix}`
      )
    }

    function ends(suffix) {
      const str = utils.flag(this, 'object')

      return this.assert(
        str.endsWith(suffix),
        `expected ${str} to end with ${suffix}`,
        `expected ${str} not to end with ${suffix}`
      )
    }

    chai.Assertion.addChainableMethod('startWith', starts)
    chai.Assertion.addChainableMethod('start', starts)

    chai.Assertion.addChainableMethod('endWith', ends)
    chai.Assertion.addChainableMethod('end', ends)
  }
};
