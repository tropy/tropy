import { project } from '#tropy/storage/migrations.js'

describe('Storage migrations', () => {
  describe('project', () => {
    let migrate = (data, number) =>
      project.migrations.find(m => m.number === number).up(data)

    it('#1 removes names not restored', () => {
      expect(migrate({ nav: {}, panel: {}, old: {} }, 1))
        .to.include.keys('nav', 'panel')
        .and.not.to.include.keys('old')
    })

    it('#1 converts the legacy view', () => {
      let view = (legacy) => migrate({ nav: legacy }, 1).nav.view
      let list = { name: 'list', id: 3 }

      expect(view({ list: 3 })).to.eql(list)
      expect(view({ list: -1 })).to.eql({ name: 'unlisted' })
      expect(view({ trash: true, list: 3 })).to.eql({ name: 'trash' })
      expect(view({ view: list, trash: true })).to.eql(list)
      expect(view({ list: null, trash: null })).to.be.undefined
    })

    it('#1 converts the legacy item selection', () => {
      expect(migrate({ nav: { items: [1, 2], activity: 'x', imports: true } }, 1).nav)
        .to.eql({
          view: undefined,
          item: { selected: { 1: true, 2: true }, anchor: 2, cursor: 2 }
        })
    })
  })
})
