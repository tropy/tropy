import { Image } from '#tropy/image/index.js'

describe('Image', () => {
  describe('given an image', () => {
    let image = new Image({ path: F.image.path('apricot.jpg') })

    before(() => image.open())

    it('computes its checksum', () => {
      expect(image.checksum).to.equal('ee2292e7f608174ec7c51c2623a08ba2')
    })

    it('computes its mimetype', () => {
      expect(image.mimetype).to.equal('image/jpeg')
    })

    it('computes its title', () => {
      expect(image.name).to.equal('apricot')
    })

    it('computes its size', () => {
      expect(image).to.have.property('width', 640)
      expect(image).to.have.property('height', 480)
    })

    it('computes exif data', () => {
      expect(image.meta[0].exif).to.contain.keys([
        'http://www.w3.org/2003/12/exif/ns#orientation',
        'http://www.w3.org/2003/12/exif/ns#dateTimeOriginal',
        'http://www.w3.org/2003/12/exif/ns#dateTime'
      ])
    })

    it('computes file stats', () => {
      expect(image)
        .to.have.property('fs')
        .that.contains.keys(['size', 'birthtimeMs'])
    })
  })

  describe('formats', () => {
    for (let [file, mimetype, width, height] of [
      ['apricot.jpg', 'image/jpeg', 640, 480],
      ['sand.jpg', 'image/jpeg', 640, 480], // CMYK
      ['mint.png', 'image/png', 240, 240],
      ['rose.webp', 'image/webp', 640, 480],
      ['butter.tif', 'image/tiff', 320, 240],
      ['coral.jxl', 'image/jxl', 400, 300],
      ['aqua.j2k', 'image/jp2', 640, 480] // JPEG 2000 codestream
    ]) {
      it(`opens ${file} and makes its icon`, async () => {
        let image = new Image({ path: F.image.path(file) })
        await image.open()

        expect([image.mimetype, image.width, image.height])
          .to.eql([mimetype, width, height])

        let { info } = await (await image.resize(Image.SIZE[48]))
          .toBuffer({ resolveWithObject: true })

        expect(Math.max(info.width, info.height)).to.equal(48)
      })
    }
  })
})
