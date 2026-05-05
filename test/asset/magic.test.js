import { magic } from '#tropy/asset/magic.js'
import { IMAGE, MIME } from '#tropy/constants/index.js'

describe('asset magic', () => {
  it('detects raw camera files by extension', () => {
    for (let ext of IMAGE.RAW.EXT) {
      expect(magic(Buffer.alloc(0), `.${ext}`)).to.equal(MIME.RAW)
    }
  })

  it('prefers raw camera extensions over TIFF magic', () => {
    let tiff = Buffer.from([0x49, 0x49, 42, 0])

    expect(magic(tiff, '.CR2')).to.equal(MIME.RAW)
  })

  it('keeps strong magic numbers ahead of raw camera extensions', () => {
    let jpeg = Buffer.from([0xFF, 0xD8, 0xFF])
    let pdf = Buffer.from([0x25, 0x50, 0x44, 0x46])

    expect(magic(jpeg, '.CR2')).to.equal(MIME.JPEG)
    expect(magic(pdf, '.CR2')).to.equal(MIME.PDF)
  })
})
