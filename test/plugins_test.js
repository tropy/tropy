'use strict'

const { join } = require('path')
const Plugins = __require('plugins')

describe('Plugins', () => {

  it('valid config matches', () => {
    const plugins = new Plugins(join(__dirname, 'fixtures'))
    expect(plugins.config).to.eql([
      {
        plugin: 'tropy-plugin',
        label: 'Plugin Name',
        config: {
          specific: 'to plugin'
        }
      }
    ])
  })

  it('invalid config throws error', () => {
    expect(() => { new Plugins('invalid') })
      .to.throw(/^Plugin config file .*? not valid$/)
  })

})
