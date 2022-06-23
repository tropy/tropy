import { Shader } from '../src/res.js'

describe('Shader', () => {
  it('loads shaders synchronously', () => {
    expect(Shader.load('sharpen.frag')).to.match(/void main\(void\)/)
  })
})
