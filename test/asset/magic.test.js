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

  it('detects jpeg 2000 containers and bare codestreams', () => {
    let jp2 = Buffer.from([
      0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20, 0x0D, 0x0A, 0x87, 0x0A
    ])
    let j2c = Buffer.from([0xFF, 0x4F, 0xFF, 0x51])

    expect(magic(jp2)).to.equal(MIME.JP2)
    expect(magic(j2c)).to.equal(MIME.JP2)

    for (let ext of ['.jp2', '.jpg2', '.jpf', '.jpx', '.j2k', '.j2c', '.jpc'])
      expect(magic(Buffer.alloc(8), ext), ext).to.equal(MIME.JP2)
  })

  it('detects jpeg xl containers and bare codestreams', () => {
    let jxl = Buffer.from([
      0x00, 0x00, 0x00, 0x0C, 0x4A, 0x58, 0x4C, 0x20, 0x0D, 0x0A, 0x87, 0x0A
    ])

    expect(magic(jxl)).to.equal(MIME.JXL)
    expect(magic(Buffer.from([0xFF, 0x0A, 0x00, 0x00]))).to.equal(MIME.JXL)
  })

  it('detects avif sequences and heif variants', () => {
    let brand = (b) => Buffer.concat([Buffer.alloc(4), Buffer.from(`ftyp${b}`)])

    expect(magic(brand('avis'))).to.equal(MIME.AVIF)
    expect(magic(Buffer.alloc(8), '.avifs')).to.equal(MIME.AVIF)
    expect(magic(brand('heix'), '.hif')).to.equal(MIME.HEIC)
  })

  it('keeps strong magic numbers ahead of raw camera extensions', () => {
    let jpeg = Buffer.from([0xFF, 0xD8, 0xFF])
    let pdf = Buffer.from([0x25, 0x50, 0x44, 0x46])

    expect(magic(jpeg, '.CR2')).to.equal(MIME.JPEG)
    expect(magic(pdf, '.CR2')).to.equal(MIME.PDF)
  })
})
