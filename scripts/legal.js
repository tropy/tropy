'use strict'

const fs = require('fs')
const path = require('path')
const legalEagle = require('legal-eagle')
const cwd = process.cwd()

// the output will be written to a file in the tropy.org repository
const websiteRepo = process.argv[process.argv.length - 1]
let canWrite
try {
  canWrite = fs.statSync(websiteRepo).isDirectory()
} catch (_) {
  canWrite = false
}
if (!canWrite) {
  console.error('Usage: node scripts/legal <path/to/tropy.org>')
  return
}

legalEagle(
  { path: cwd },
  (err, depLicenses) => {
    if (err) return console.error(err)
    const licenses = consolidate(depLicenses)
    let text = ''
    for (let pkg of Object.keys(licenses).sort()) {
      const data = licenses[pkg]
      text += '<div class="dependency">'
      text += ` <a href="#" class="package">${pkg}</a>\n`
      text += ' <div class="license" style="display: none">\n'
      const preText = escapeHTML(data.sourceText) || `License: ${data.license}`
      text += `  <pre>${preText}</pre>\n`
      text += ' </div>\n'
      text += '</div>\n'
    }

    const outFile = path.join(
      websiteRepo, 'views', 'partials', 'dependencies.hbs')
    fs.writeFile(outFile, text, 'utf8', () => {
      console.log(`Wrote dependencies' licenses to "${outFile}"`)
    })
  })

function stripVersion(packageName) {
  return packageName.replace(/@.*$/, '')
}

function consolidate(licenses) {
  // merge licenses under one (use data of latest version)
  const result = {}
  for (let pkg of Object.keys(licenses).sort()) {
    result[stripVersion(pkg)] = licenses[pkg]
  }
  return result
}

function escapeHTML(text) {
  if (!text) return
  return text
    .replace('<', '&lt;')
    .replace('>', '&gt;')
}
