import { Shader } from '#tropy/res.js'

describe('Shader', () => {
  it('loads shaders synchronously', () => {
    expect(Shader.load('sharpen.frag')).to.match(/void main\(void\)/)
  })
})
