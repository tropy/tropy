import { Mesh, MeshGeometry, Shader, Texture } from 'pixi.js'
import { Shader as ShaderResource } from '../res.js'

// A quad which draws its texture through a perspective correction.
// Its local coordinates are corrected pixels: the fragment shader
// maps each of them back into the texture.
export class KeystoneMesh extends Mesh {
  constructor () {
    let geometry = new MeshGeometry({
      positions: new Float32Array(8),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3])
    })

    let shader = Shader.from({
      gl: {
        vertex: ShaderResource.load('keystone.vert'),
        fragment: ShaderResource.load('keystone.frag'),
        name: 'keystone'
      },
      resources: {
        uTexture: Texture.EMPTY.source,
        uSampler: Texture.EMPTY.source.style,
        keystoneUniforms: {
          uInverse: {
            value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
            type: 'mat3x3<f32>'
          },
          uSize: {
            value: new Float32Array([1, 1]),
            type: 'vec2<f32>'
          }
        }
      }
    })

    super({ geometry, shader })
  }

  get texture () {
    return super.texture
  }

  // NB: called by the Mesh constructor, before our own fields exist!
  set texture (texture) {
    super.texture = texture

    let { source } = this.texture
    this.shader.resources.uTexture = source
    this.shader.resources.uSampler = source.style

    this.update()
  }

  // Sets the correction (see keystone.js) and places the quad
  // around the whole corrected photo.
  sync (correction) {
    let { x, y, width, height } = correction.bounds

    this.correction = correction
    this.geometry.positions = new Float32Array([
      x, y,
      x + width, y,
      x + width, y + height,
      x, y + height
    ])

    this.update()
  }

  // Uploads the inverse, normalized by the texture size.
  update () {
    let { correction, texture } = this
    if (correction == null || texture == null) return

    let { inverse } = correction
    let { width, height } = texture.source
    let { keystoneUniforms } = this.shader.resources
    let { uInverse: m, uSize } = keystoneUniforms.uniforms

    uSize[0] = width
    uSize[1] = height

    // Row-major to column-major
    for (let r = 0; r < 3; ++r) {
      let scale = (r === 0) ? width : (r === 1) ? height : 1

      for (let c = 0; c < 3; ++c) {
        m[c * 3 + r] = inverse[r * 3 + c] / scale
      }
    }

    keystoneUniforms.update()
  }

  destroy (options) {
    let { geometry, shader } = this

    this.correction = null
    super.destroy(options)

    geometry?.destroy()
    shader?.destroy()
  }
}
