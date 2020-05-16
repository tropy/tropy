'use strict'

const PIXI = require('pixi.js')
// const { restrict } = require('../../common/util')
const res = require('../../common/res')
const frag = res.shader.load('balance.frag')


class BalanceFilter extends PIXI.Filter {
  constructor(arg1 = 0) {
    super(undefined, frag)
    this.arg1 = arg1
  }

  get arg1() {
    return this.uniforms.arg1
  }

  set arg1(value) {
    this.uniforms.arg1 = value
  }
}

module.exports = {
  BalanceFilter
}
