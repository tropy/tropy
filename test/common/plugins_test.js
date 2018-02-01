'use strict'

const { Plugins } = __require('common/plugins')
const config = require('../fixtures/plugins')

describe('Plugins', () => {
  before(P.copyFixtures)
  const basic = new Plugins(config)

  it('valid config matches', () => {
    expect(basic.plugins.length).to.eql(2)
    expect(basic.plugins[0]).to.eql({
      plugin: 'tropy-plugin',
      label: 'Plugin Name',
      config: {
        specific: 'to plugin'
      }
    })
  })

  it('invalid config does not throw error', () => {
    // just warns
    const p = new Plugins()
    expect(() => p.initialize()).to.not.throw()
    expect(p.plugins.length).to.eql(0)
    expect(p.handlers('foo').length).to.eql(0)
  })

  it('list package names', () => {
    expect(basic.packages).to.eql(['tropy-plugin'])
  })

  it('initialize with bad plugins', () => {
    const cfg = [{
      plugin: 'foo',
      config: {}
    }]

    const plugins = new Plugins(cfg)
    plugins.initialize()
    expect(() => plugins.initialize()).to.not.throw()
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

  it('handlers', () => {
    it('normal case', () => {
      expect(basic.handlers('export').map(r => r.label))
        .to.be.eql(['Plugin Name', 'Another Plugin'])
    })
    it('exists but is not a function', () => {
      expect(basic.handlers('tropy-hook')).to.be.eql([])
    })
    it('not registered', () => {
      expect(basic.handlers('unknown')).to.be.eql([])
    })
  })

})
