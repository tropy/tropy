import { init, open, toBuffer } from '#tropy/image/sharp.js'

describe('sharp', () => {
  it('has a version', async () => {
    let sharp = await init()
    expect(sharp.versions).to.have.property('sharp')
    expect(sharp.versions).to.have.property('vips')
  })

  it('resizes to fit without enlarging', async () => {
    let input = F.image.path('PA140105.JPG')
    let size = async (opts) =>
      (await (await open(await toBuffer('png', input, {}, opts))).metadata())

    let { width, height } = await size()

    expect(await size({ width: 100 })).to.include({ width: 100 })
    expect((await size({ width: 100, height: 10 })).height).to.equal(10)
    expect(await size({ width: width * 2 })).to.include({ width, height })
  })
  it('crops a region before resizing', async () => {
    let input = F.image.path('PA140105.JPG')
    let size = async (opts) =>
      (await (await open(await toBuffer('png', input, {}, opts))).metadata())

    let region = { x: 10, y: 20, width: 40, height: 30 }

    expect(await size({ region })).to.include({ width: 40, height: 30 })
    expect(await size({ region, width: 20 })).to.include({ width: 20, height: 15 })
  })
})
