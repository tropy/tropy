'use strict'

const PIXI = require('pixi.js')
const vertex = PIXI.Filter.defaultVertexSrc
const { restrict } = require('../../common/util')
const { Resource } = require('../../common/res')
const { join } = require('path')
const { readFileSync: read } = require('fs')

const fragment = read(join(Resource.base, 'shader', 'unsharp.frag'), 'utf-8')


class UnsharpMaskFilter extends PIXI.Filter {
  constructor(intensity = 10, width = 200, height = 200) {
    super(vertex, fragment)
    this.uniforms.size = new Float32Array(2)
    this.intensity = intensity
    this.width = width
    this.height = height
  }

  get intensity() {
    return this.uniforms.intensity
  }

  set intensity(intensity) {
    this.uniforms.intensity = restrict(intensity / 10, 0, 10)
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
  UnsharpMaskFilter
}
