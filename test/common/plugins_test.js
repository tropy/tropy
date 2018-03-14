'use strict'

describe('Plugins', () => {
  const { Plugins } = __require('common/plugins')

  let plugins

  beforeEach(async () => {
    plugins = new Plugins(F.plugins().path)
    await plugins.init()
  })

  it('valid config matches', () => {
    expect(plugins.config.length).to.eql(2)
    expect(plugins.config[0]).to.have.keys(['plugin', 'name', 'options'])
    expect(plugins.config[1]).to.have.keys(['plugin'])
  })

  it('hooks can be scanned', () => {
    expect(plugins.spec[0].hooks).to.have.property('sum', true)
    expect(plugins.spec[1].hooks).to.have.property('export', false)
  })

  describe('available()', () => {
    it('registered hooks', () => {
      expect(plugins.available('sum')).to.eql([
        { id: '0', name: 'Plugin Name' },
        { id: '1', name: 'tropy-plugin #1' }
      ])
    })

    it('unknown hooks', () => {
      expect(plugins.available('export')).to.be.eql([])
    })
  })

  it('create()', () => {
    expect(plugins.create()).to.have.keys('0', '1')
  })

  it('exec()', async () => {
    await plugins.reloadScanCreate()
    const a = await plugins.exec({ id: 0, action: 'sum' }, 40, 2)
    const b = await plugins.exec({ id: 1, action: 'sum' }, 40, 2)

    expect(a).to.eql(-42)
    expect(b).to.eql(42)
  })
})
