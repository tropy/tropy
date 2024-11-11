import { Filter, GlProgram, GpuProgram } from 'pixi.js'
import { vertex, wgslVertex } from 'pixi-filters'
import { restrict } from '../../common/util.js'
import { Shader } from '../../res.js'


export class SharpenFilter extends Filter {
  constructor(intensity = 0, width = 200, height = 200) {
    super({
      gpuProgram: GpuProgram.from({
        fragment: {
          source: Shader.load('sharpen.wgsl'),
          entryPoint: 'mainFragment'
        },
        vertex: {
          source: wgslVertex,
          entryPoint: 'mainVertex'
        }
      }),
      glProgram: GlProgram.from({
        fragment: Shader.load('sharpen.frag'),
        vertex,
        name: 'sharpen-filter'
      }),
      resources: {
        sharpenUniforms: {
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

  get uniforms() {
    return this.resources.sharpenUniforms.uniforms
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
