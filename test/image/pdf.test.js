import { readFile } from 'node:fs/promises'
import { extractPdfEmbeddedFiles } from '#tropy/image/pdf.js'
import { Image } from '#tropy/image/index.js'

const FIXTURE = 'veraPDF test suite 6-9-t03-pass-a.pdf'

describe('pdf', () => {
  describe('extractPdfEmbeddedFiles', () => {
    let buffer

    before(async () => {
      buffer = await readFile(F.image.path(FIXTURE))
    })

    it('extracts embedded files even without a /Collection', async () => {
      let files = await extractPdfEmbeddedFiles(buffer)

      expect(files).to.have.lengthOf(1)
      expect(files[0]).to.include({
        name: 'File.pdf',
        mimetype: 'application/pdf'
      })
      expect(files[0].data).to.be.an.instanceof(Buffer)
      expect(files[0].data.length).to.be.above(0)
    })

    it('returns null for a pdf with no embedded files', async () => {
      // The embedded File.pdf is itself a plain pdf with no attachments.
      let [{ data }] = await extractPdfEmbeddedFiles(buffer)
      expect(await extractPdfEmbeddedFiles(data)).to.be.null
    })
  })

  describe('optimize on import', () => {
    it('optimizes an embedded file built from its buffer', async () => {
      let [{ name, data, mimetype }] =
        await extractPdfEmbeddedFiles(await readFile(F.image.path(FIXTURE)))

      let image = await Image.fromBuffer({
        buffer: data,
        mimetype,
        filename: name
      })

      expect(image.mimetype).to.equal('application/pdf')

      let optimized = await image.optimize()

      expect(optimized).to.be.true
      expect(image.mimetype).to.be.oneOf(['image/jpeg', 'image/png'])
      expect(image.path).to.match(/\.(jpg|png)$/)
      expect(image.fs.size).to.equal(image.buffer.length)
    })
  })
})
