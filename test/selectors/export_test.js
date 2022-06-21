import { version } from '../../src/common/release'
import { pick } from '../../src/common/util'
import { getExportItemIds, getExportItems } from '../../src/selectors/export'

describe('Export Selectors', () => {
  describe('getExportItemIds', () => {
    it('selects passed-in ids only', () => {
      expect(getExportItemIds({}, { id: [42] })).to.eql([42])
    })

    describe('when there are items selected', () => {
      it('selects selected items when no id given', () => {
        expect(
          getExportItemIds({ nav: { items: [23] } })
        ).to.eql([23])
      })
    })

    describe('when there are no items selected', () => {
      it('selects all visible items when no id given', () => {
        expect(
          getExportItemIds({
            nav: { items: [] },
            qr: { items: [7] }
          })
        ).to.eql([7])
      })
    })
  })

  describe('getExportItems', () => {
    const state = pick(F, [
      'items',
      'lists',
      'metadata',
      'notes',
      'ontology',
      'photos',
      'selections',
      'tags'])


    it('includes @context', () => {
      expect(getExportItems(state, { id: [1] }))
        .to.have.property('@context')
        .and.to.have.property('@version', 1.1)
    })

    it('includes @graph', () => {
      expect(getExportItems(state, { id: [1] }))
        .to.have.property('@graph')
        .and.to.have.length(1)
    })

    it('includes version', () => {
      expect(getExportItems(state, { id: [1] }))
        .to.have.property('version', version)
    })

    describe('the exported item', () => {
      let json
      let item

      before(() => {
        json = getExportItems(state, { id: [1] })
        item = json['@graph'][0]
      })

      it('includes tag names', () => {
        expect(item.tag).to.eql(F.items[1].tags.map(id => F.tags[id].name))
      })

      it('includes list names', () => {
        expect(item.list).to.eql(F.items[1].lists.map(id => F.lists[id].name))
      })

      it('includes photos', () => {
        expect(item.photo).to.have.length(F.items[1].photos.length)
      })

      it('includes metadata', () => {
        expect(item.title).to.eql(
          F.metadata[1]['http://purl.org/dc/elements/1.1/title'].text)

        expect(json['@context']).to.have.property(
          'title',
          'http://purl.org/dc/elements/1.1/title')

        let photo = F.items[1].photos[0]

        expect(item.photo[0]).to.have.property(
          'dcterms:title',
          F.metadata[photo]['http://purl.org/dc/terms/title'].text)

        expect(json['@context'])
          .to.have.property('dcterms', 'http://purl.org/dc/terms/')

        expect(item.photo[0]).to.have.property(
          'http://example.org/title',
          F.metadata[photo]['http://example.org/title'].text)

        expect(item).to.have.property(
          'http://example.org/contrast',
          F.metadata[1]['http://example.org/contrast'].text)
      })
    })
  })
})
