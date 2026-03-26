import { version } from '#tropy/common/release.js'
import { pick } from '#tropy/common/util.js'
import { getExportItemIds, getExportItems } from '#tropy/selectors/export.js'

import items from '../fixtures/items.js'
import lists from '../fixtures/lists.js'
import metadata from '../fixtures/metadata.js'
import notes from '../fixtures/notes.js'
import ontology from '../fixtures/ontology.js'
import photos from '../fixtures/photos.js'
import selections from '../fixtures/selections.js'
import tags from '../fixtures/tags.js'
import transcriptions from '../fixtures/transcriptions.js'

const fixtures = {
  items, lists, metadata, notes,
  ontology, photos, selections, tags, transcriptions
}

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
    const state = pick(fixtures, [
      'items',
      'lists',
      'metadata',
      'notes',
      'transcriptions',
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
        expect(item.tag).to.eql(items[1].tags.map(id => tags[id].name))
      })

      it('includes list paths', () => {
        expect(item.list).to.eql(['A list apart', 'A list apart/A\\/B'])
      })

      it('includes photos', () => {
        expect(item.photo).to.have.length(items[1].photos.length)
      })

      it('includes metadata', () => {
        expect(item.title).to.eql(
          metadata[1]['http://purl.org/dc/elements/1.1/title'].text)

        expect(json['@context']).to.have.property(
          'title',
          'http://purl.org/dc/elements/1.1/title')

        let photo = items[1].photos[0]

        expect(item.photo[0]).to.have.property(
          'dcterms:title',
          metadata[photo]['http://purl.org/dc/terms/title'].text)

        expect(json['@context'])
          .to.have.property('dcterms', 'http://purl.org/dc/terms/')

        expect(item.photo[0]).to.have.property(
          'http://example.org/title',
          metadata[photo]['http://example.org/title'].text)

        expect(item).to.have.property(
          'http://example.org/contrast',
          metadata[1]['http://example.org/contrast'].text)
      })
    })
  })
})
