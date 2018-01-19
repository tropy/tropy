'use strict'

const { join } = require('path')
const Plugins = __require('plugins')

describe('Plugins', () => {
  const plugins = new Plugins(join(__dirname, 'fixtures'))

  it('valid config matches', () => {
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

  it('list package names', () => {
    expect(plugins.packages).to.eql(['tropy-plugin'])
  })
})
