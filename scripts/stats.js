'use strict'

const fetch = require('node-fetch')
const util = require('util')

const VERSIONS = [
  '1.1.3',
  '1.1.2',
  '1.1.1',
  '1.1.0',
  '1.0.4',
  '1.0.3',
  '1.0.2',
  '1.0.1',
  '1.0.0'
]

const GH = 'https://api.github.com/repos/tropy/tropy/releases/tags'

async function count(version) {
  const res = await fetch(`${GH}/${version}`)

  if (res.status !== 200) {
    throw new Error(`request failed: ${res.status} ${res.statusText}`)
  }

  const { assets } = await res.json()
  return assets.reduce((c, a) => (
    (c[a.name.replace(`-${version}`, '')] = a.download_count), c
  ), { version })

}

function merge(a, b) {
  for (let x in b) {
    if (x === 'version') continue
    if (x === 'RELEASES') continue
    a[x] = (a[x] || 0) + b[x]
  }
  return a
}

async function collect(versions) {
  try {
    const counts = await Promise.all(versions.map(count))
    console.log(util.inspect(counts))

    const totals = counts.reduce(merge)
    console.log(util.inspect(totals))

  } catch (error) {
    console.error(error.message)
    console.error(error.stack)
  }
}

collect(VERSIONS)
