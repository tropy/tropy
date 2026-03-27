import { init } from '#tropy/image/sharp.js'

describe('sharp', () => {
  it('has a version', async () => {
    let sharp = await init()
    expect(sharp.versions).to.have.property('sharp')
    expect(sharp.versions).to.have.property('vips')
  })
})
