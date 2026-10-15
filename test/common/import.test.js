import { eachItem, normalize } from '#tropy/common/import.js'

describe('import', () => {
  describe('eachItem', () => {
    it('imports photo transcriptions', async () => {
      let [item] = [...eachItem(await normalize({
        '@graph': [{
          photo: [{
            path: 'photo.jpg',
            transcription: [{ text: 'Lorem ipsum' }]
          }]
        }]
      }))]

      expect(item.photos[0].data).to.eql({})
      expect(item.photos[0].transcriptions).to.eql([
        { text: 'Lorem ipsum', alto: undefined }
      ])
    })

    it('skips empty properties', async () => {
      let [item] = [...eachItem(await normalize({
        '@graph': [{
          'http://purl.org/dc/elements/1.1/title': [],
          'photo': [{
            path: 'photo.jpg',
            transcription: []
          }]
        }]
      }))]

      expect(item.data).to.eql({})
      expect(item.photos[0].image.path).to.equal('photo.jpg')
      expect(item.photos[0].transcriptions).to.eql([])
    })
  })
})
