import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IMAGE } from '#tropy/constants/index.js'

const entries = (dict) => {
  let result = {}

  for (let node of dict.children) {
    if (node.tagName === 'key')
      result[node.textContent] = node.nextElementSibling
  }

  return result
}

describe('IMAGE', () => {
  it('has no duplicate extensions or associations', () => {
    expect(IMAGE.EXT).to.have.lengthOf(new Set(IMAGE.EXT).size)
    expect(IMAGE.ASSOCIATIONS)
      .to.have.lengthOf(new Set(IMAGE.ASSOCIATIONS).size)
  })

  it('declares the raw extensions in info.plist', () => {
    let plist = new DOMParser().parseFromString(
      readFileSync(join(F.appDir, 'res', 'darwin', 'info.plist'), 'utf-8'),
      'application/xml')

    let raw = [...plist.querySelectorAll('dict')]
      .map(entries)
      .find(dict => dict.CFBundleTypeName?.textContent === 'Camera Raw Image')

    expect([...raw.CFBundleTypeExtensions.children].map(e => e.textContent))
      .to.eql(IMAGE.RAW.EXT)
  })
})
