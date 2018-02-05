'use strict'

const { resolve } = require('path')
const { Plugins } = __require('common/plugins')
const config = require('../fixtures/plugins')

describe('Plugins', () => {
  const root = resolve(__dirname, '..', 'fixtures', 'plugins')
  const basic = new Plugins(root, config)

  it('valid config matches', () => {
    expect(basic.plugins.length).to.eql(2)
    expect(basic.plugins[0]).to.eql({
      plugin: 'tropy-plugin',
      name: 'Plugin Name',
      config: {
        specific: 'to plugin'
      }
    })
  })

  it('invalid config does not throw error', () => {
    // just warns
    const p = new Plugins(root)
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

    const plugins = new Plugins(root, cfg)
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

  describe('handlers', () => {
    it('normal case', () => {
      expect(basic.handlers('export').map(r => r.name))
        .to.be.eql(['Plugin Name', 'Another Plugin'])
    })
    it('full result', () => {
      expect(basic.handlers('tropy-hook')).to.eql([
        {
          fnName: 'plugin-function',
          instanceNumber: 0,
          name: 'Plugin Name'
        },
        {
          fnName: 'plugin-function',
          instanceNumber: 1,
          name: 'Another Plugin'
        }
      ]
      )
    })
    it('not registered', () => {
      expect(basic.handlers('unknown')).to.be.eql([])
    })
  })

  describe('loadPackage', () => {
    it('valid', () => {
      const result = basic.loadPackage('tropy-plugin')
      expect(result.hooks).to.have.all.keys('tropy-hook', 'export')
      expect(result.pkg).to.be.a('function')
    })
    it('invalid', () => {
      expect(basic.loadPackage('not-a-package'))
        .to.be.undefined
    })
  })
})
