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

    it('#2 moves the columns out of nav', () => {
      let columns = [{ id: 'a', width: 10 }]

      expect(migrate({ nav: { columns, sort: {} } }, 2))
        .to.eql({ nav: { sort: {} }, columns })
      expect(migrate({ panel: {} }, 2)).to.eql({ panel: {}, nav: undefined })
    })

    it('#3 nests nav by slice', () => {
      let view = { name: 'list', id: 3 }
      let item = { selected: { 1: true }, anchor: 1, cursor: 1 }

      expect(migrate({
        nav: { view, sort: {}, query: 'x', tags: [1], item, photo: 2, mode: 'item' }
      }, 3)).to.eql({
        nav: {
          search: { view, sort: {} },
          selection: { item, photo: 2, selection: undefined, note: undefined },
          mode: 'item'
        }
      })
    })

    it('#4 turns the photo and selection shown into a selection state', () => {
      let nav = (photo, selection) =>
        migrate({ nav: { selection: { item: {}, photo, selection, note: 7 } } }, 4)
          .nav.selection

      expect(nav(2, 3)).to.eql({
        item: {},
        photo: { selected: { 3: true }, anchor: 3, cursor: 3 },
        note: 7
      })
      expect(nav(2).photo).to.include({ cursor: 2 })
      expect(nav().photo).to.eql({ selected: {}, anchor: null, cursor: null })
    })
  })
})
