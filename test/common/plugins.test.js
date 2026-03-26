import { join } from 'node:path'
import { Plugins } from '#tropy/common/plugins.js'

const pluginsPath = join(import.meta.dirname, '../fixtures/plugins')

describe('Plugins', () => {
  let plugins

  beforeEach(async () => {
    plugins = new Plugins(pluginsPath)
    await plugins.init()
  })

  it('valid config matches', () => {
    expect(plugins.config.length).to.equal(2)
    expect(plugins.config[0]).to.have.keys(['plugin', 'name', 'options'])
    expect(plugins.config[1]).to.have.keys(['plugin'])
  })

  it('hooks can be scanned', async () => {
    expect(plugins.spec['tropy-omeka'].hooks).to.have.property('export', true)
    expect(plugins.spec['tropy-plugin'].hooks).to.have.property('export', false)
    expect(plugins.spec['tropy-plugin'].hooks).to.have.property('sum', true)
  })

  describe('available', () => {
    it('registered hooks', () => {
      expect(plugins.available('sum')).to.eql([
        { id: '0', name: 'Plugin Name' },
        { id: '1', name: 'tropy-plugin #1' }
      ])
    })

    it('unknown hooks', () => {
      expect(plugins.available('export')).to.eql([])
    })
  })

  it('create', async () => {
    let { instances } = await plugins.create()
    expect(instances).to.have.keys('0', '1')
  })

  it('exec', async () => {
    await plugins.reload()
    await plugins.create()
    const a = await plugins.exec({ id: 0, action: 'sum' }, 40, 2)
    const b = await plugins.exec({ id: 1, action: 'sum' }, 40, 2)

    expect(a).to.equal(-42)
    expect(b).to.equal(42)
  })

  it('list', async () => {
    expect(await plugins.list()).to.eql([
      'tropy-omeka',
      'tropy-plugin'
    ])
  })
})
