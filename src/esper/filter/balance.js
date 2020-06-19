'use strict'

const PIXI = require('pixi.js')
const res = require('../../common/res')
const { restrict } = require('../../common/util')
const frag = res.shader.load('balance.frag')


class BalanceFilter extends PIXI.Filter {
  constructor(a = 0, b = 0) {
    super(undefined, frag)
    this.a = a
    this.b = b
  }

  get a() {
    return this.uniforms.a
  }

  set a(value) {
    this.uniforms.a = restrict(value, -127, 127)
  }

  get b() {
    return this.uniforms.b
  }

  set b(value) {
    this.uniforms.b = restrict(value, -127, 127)
  }
}

module.exports = {
  BalanceFilter
}
