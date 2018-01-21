'use strict'

const { join } = require('path')
const Plugins = __require('plugins')

describe('Plugins', () => {
  const root = join(__dirname, 'fixtures')
  const basic = new Plugins(root)

  it('valid config matches', () => {
    expect(basic.config.length).to.eql(2)
    expect(basic.config[0]).to.eql({
      plugin: 'tropy-plugin',
      label: 'Plugin Name',
      config: {
        specific: 'to plugin'
      }
    })
  })

  it('invalid config throws error', () => {
    expect(() => { new Plugins('invalid') })
      .to.throw(/^Plugin config file .*? not valid$/)
  })

  it('list package names', () => {
    expect(basic.packages).to.eql(['tropy-plugin'])
  })

  it('initialize with bad plugins', () => {
    const cfg = [{
      plugin: 'foo',
    }]
    const plugins = new Plugins(root, cfg)
    expect(() => plugins.initialize())
      .to.throw(/^Plugin package "foo" can not be loaded$/)
    expect(plugins.instances).to.eql([])
  })

  it('initialize with default plugins', () => {
    expect(() => basic.initialize()).to.not.throw()
    expect(basic.instances.length).to.eql(2)
  })

  it('hooks can be read', () => {
    const hooks = {
      'tropy-hook': 'plugin-function',
      'export': 'export'
    }
    expect(basic.instances[0].hooks).to.eql(hooks)
    expect(basic.instances[1].hooks).to.eql(hooks)
    expect(basic.instances[2]).to.be.undefined
  })

})
