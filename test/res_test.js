import { Shader } from '#internal/res.js'

describe('Shader', () => {
  it('loads shaders synchronously', () => {
    expect(Shader.load('sharpen.frag')).to.match(/void main\(void\)/)
  })
})
