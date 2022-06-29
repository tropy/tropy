import { arch, platform } from 'node:process'
import parse from 'semver/functions/parse.js'
import { author, version, name, productName } from '../../package.json'
import { titlecase } from './util.js'

const v = parse(version)
const isLatest = !(v?.prerelease.length > 0)

export const channel = (isLatest) ?
  'latest' :
  (v.prerelease[0] === 'beta' ? 'beta' : 'alpha')

export const qualified = {
  name: (isLatest) ? name : `${name}-${channel}`,
  product: (isLatest) ? productName : `${productName} ${titlecase(channel)}`
}

export const exe = qualified[(platform === 'linux') ? 'name' : 'product']

export const feed = (platform === 'win32') ?
  `https://tropy.org/update/${channel}/${platform}/${arch}` :
  `https://tropy.org/update/${channel}/${platform}/${arch}/${version}`

export {
  author,
  name,
  productName as product,
  version
}
