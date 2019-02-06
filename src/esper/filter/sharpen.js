'use strict'

const PIXI = require('pixi.js')
const { restrict } = require('../../common/util')
const { Shader } = require('../../common/res')
const frag = Shader.load('sharpen.frag')


class SharpenFilter extends PIXI.Filter {
  constructor(intensity = 0, width = 200, height = 200) {
    super(undefined, frag)
    this.uniforms.size = new Float32Array(2)
    this.intensity = intensity
    this.width = width
    this.height = height
  }

  get intensity() {
    return this.uniforms.intensity
  }

  set intensity(intensity) {
    this.uniforms.intensity = restrict(intensity / 100, 0, 10)
  }

  get width() {
    return 1 / this.uniforms.size[0]
  }

  set width(value) {
    this.uniforms.size[0] = 1 / value
  }

  get height() {
    return 1 / this.uniforms.size[1]
  }

  set height(value) {
    this.uniforms.size[1] = 1 / value
  }
}

module.exports = {
  SharpenFilter
}
