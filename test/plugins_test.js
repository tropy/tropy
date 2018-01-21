'use strict'

const { join } = require('path')
const Plugins = __require('plugins')

describe('Plugins', () => {
  const root = join(__dirname, 'fixtures')

  it('valid config matches', () => {
    const plugins = new Plugins(root)
    expect(plugins.config.length).to.eql(2)
    expect(plugins.config[0]).to.eql({
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
    const plugins = new Plugins(root)
    expect(plugins.packages).to.eql(['tropy-plugin'])
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
    const plugins = new Plugins(root)
    expect(() => plugins.initialize()).to.not.throw()
    expect(plugins.instances.length).to.eql(2)
  })

})
