import { Storage } from '#tropy/storage.js'

describe('Storage', () => {
  let storage = new Storage('storage.test')

  let data = () =>
    Object.fromEntries(storage.names().map(name => [name, storage.load(name)]))

  afterEach(() => {
    for (let name of storage.names()) storage.remove(name)
  })

  it('loads invalid JSON as null', () => {
    localStorage.setItem(storage.expand('nav'), '{')
    expect(storage.load('nav')).to.be.null
  })

  describe('migrate', () => {
    let migrations = [
      { number: 1, up: ({ old, ...rest }) => ({ ...rest, a: old }) },
      { number: 2, up: (data) => ({ ...data, b: data.a + 1 }) }
    ]

    it('runs the migrations not yet applied, in order', () => {
      storage.save('old', 1).save('settings', 'x')
      storage.migrate({ migrations, ignore: ['settings'] })

      expect(data()).to.eql({ a: 1, b: 2, settings: 'x', storage: 2 })
    })

    it('runs nothing up to date or newer', () => {
      storage.save('old', 1).save('storage', 2)
      storage.migrate({ migrations })
      storage.save('storage', 3).migrate({ migrations })

      expect(data()).to.eql({ old: 1, storage: 3 })
    })

    it('runs only the migrations above the stored number', () => {
      storage.save('a', 1).save('storage', 1)
      storage.migrate({ migrations })

      expect(data()).to.eql({ a: 1, b: 2, storage: 2 })
    })

    it('removes all but the ignored data if a migration fails', () => {
      storage.save('a', 1).save('settings', 'x')
      storage.migrate({
        migrations: [{ number: 1, up () { throw new Error() } }],
        ignore: ['settings']
      })

      expect(data()).to.eql({ settings: 'x', storage: 1 })
    })

    it('removes invalid JSON', () => {
      localStorage.setItem(storage.expand('a'), '{')
      storage.migrate({ migrations: [{ number: 1, up: (d) => d }] })

      expect(storage.names()).to.eql(['storage'])
    })
  })
})
