import { Filter } from 'pixi.js'
import { restrict } from '../../common/util.js'
import { Shader } from '../../res.js'


export class SharpenFilter extends Filter {
  constructor(intensity = 0, width = 200, height = 200) {
    super(undefined, Shader.load('sharpen.frag'))
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
