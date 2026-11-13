import process from 'node:process'
import semver from 'semver'
import { sed } from './util.js'

const VERSION = process.env.npm_package_version

const METAINFO = 'res/linux/org.tropy.Tropy.metainfo.xml'
const RELEASES = '  <releases>'
const CITATION = 'CITATION.cff'

function datestring (date = new Date) {
  return date.toISOString().slice(0, 10)
}

const DATE = datestring()

if (!semver.valid(VERSION)) {
  console.error('no valid npm version given')
  process.exit(1)
}

if (!semver.prerelease(VERSION)) {
  const release = [
    `    <release version="${VERSION}" date="${DATE}">`,
    `      <url>https://github.com/tropy/tropy/releases/tag/v${VERSION}</url>`,
    '    </release>'
  ]
  sed(METAINFO, [RELEASES, [RELEASES, ...release].join('\n')])

  sed(CITATION,
    [/^version: [\d+.]+$/m, `version: ${VERSION}`],
    [/^date-released: '[\d+-]+'$/m, `date-released: '${DATE}'`])
}
