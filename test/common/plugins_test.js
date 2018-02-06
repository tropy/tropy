'use strict'

describe('Plugins', () => {
  const { Plugins } = __require('common/plugins')

  let basic

  beforeEach(async () => {
    basic = new Plugins(F.plugins().path)
    await basic.init()
  })

  it('valid config matches', () => {
    expect(basic.config.length).to.eql(2)
    expect(basic.config[0]).to.have.keys(['plugin', 'name', 'options'])
    expect(basic.config[1]).to.have.keys(['plugin'])
  })

  it('hooks can be scanned', () => {
    basic.scan()
    expect(basic.spec[0].hooks).to.have.property('sum', true)
    expect(basic.spec[1].hooks).to.have.property('export', false)
  })

  describe('available()', () => {
    beforeEach(() => basic.scan())

    it('registered hooks', () => {
      expect(basic.available('sum')).to.eql([
        { id: '0', name: 'Plugin Name' },
        { id: '1', name: 'tropy-plugin #1' }
      ])
    })

    it('unknown hooks', () => {
      expect(basic.available('export')).to.be.eql([])
    })
  })

  it('create()', () => {
    expect(basic.create().instances).to.have.keys('0', '1')
  })

  it('exec()', async () => {
    basic.create()
    const a = await basic.exec({ id: 0, action: 'sum' }, 40, 2)
    const b = await basic.exec({ id: 1, action: 'sum' }, 40, 2)

    expect(a).to.eql(-42)
    expect(b).to.eql(42)
  })
})
