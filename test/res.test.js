import { basename } from 'node:path'
import { KeyMap, Shader } from '#tropy/res.js'

describe('Shader', () => {
  it('loads shaders synchronously', () => {
    expect(Shader.load('sharpen.frag')).to.match(/void main\(void\)/)
  })
})

describe('KeyMap', () => {
  it('is not localized', () => {
    expect(basename(KeyMap.expand('renderer'))).to.equal('renderer.yml')
  })

  it('opens the keymap for the current platform', async () => {
    let res = await KeyMap.open()
    expect(res.map).to.have.property('global')
    expect(res.map.global).to.have.property('find')
  })
})
