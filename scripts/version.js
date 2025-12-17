import process from 'node:process'
import semver from 'semver'
import shx from 'shelljs'

const VERSION = process.env.npm_package_version

const METAINFO = 'res/linux/org.tropy.Tropy.metainfo.xml'
const RELEASES = '  <releases>'
const CITATION = 'CITATION.cff'

function datestring(date = new Date) {
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
  shx.sed('-i', RELEASES, [RELEASES, ...release].join('\n'), METAINFO)

  shx.sed('-i', /^version: [\d+.]+$/, `version: ${VERSION}`, CITATION)
  shx.sed('-i', /^date-released: '[\d+-]+'$/, `date-released: '${DATE}'`, CITATION)
}
