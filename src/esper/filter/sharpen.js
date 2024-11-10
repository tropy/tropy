import { Filter, GlProgram } from 'pixi.js'
import { vertex } from 'pixi-filters'
import { restrict } from '../../common/util.js'
import { Shader } from '../../res.js'


export class SharpenFilter extends Filter {
  constructor(intensity = 0, width = 200, height = 200) {
    super({
      glProgram: GlProgram.from({
        fragment: Shader.load('sharpen.frag'),
        vertex,
        name: 'sharpen-filter'
      }),
      resources: {
        sharpen: {
          size: {
            value: new Float32Array(2),
            type: 'vec2<f32>'
          },
          intensity: {
            value: 0.0,
            type: 'f32'
          }
        }
      }
    })

    this.intensity = intensity
    this.width = width
    this.height = height
  }

  get intensity() {
    return this.resources.sharpen.uniforms.intensity
  }

  set intensity(intensity) {
    this.resources.sharpen.uniforms.intensity = restrict(intensity / 100, 0, 10)
  }

  get width() {
    return 1 / this.resources.sharpen.uniforms.size[0]
  }

  set width(value) {
    this.resources.sharpen.uniforms.size[0] = 1 / value
  }

  get height() {
    return 1 / this.resources.sharpen.uniforms.size[1]
  }

  set height(value) {
    this.resources.sharpen.uniforms.size[1] = 1 / value
  }
}
