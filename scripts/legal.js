'use strict'

const fs = require('fs')
const path = require('path')
const legalEagle = require('legal-eagle')
const cwd = process.cwd()

const js = `<script language="javascript">
var acc = document.getElementsByClassName("package");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].onclick = function(event) {
    event.preventDefault()
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.display === "block") {
      panel.style.display = "none";
    } else {
      panel.style.display = "block";
    }
  }
}</script>\n`
const head = '<div class="container">\n' +
  '<div class="row">\n' +
  '<div class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2' +
  'col-lg-8 col-lg-offset-2">\n' +
  '<h1>License</h1>\n'
const foot = '</div></div></div>' + js

legalEagle(
  { path: cwd },
  (err, depLicenses) => {
    if (err) return console.error(err)
    let licence = fs.readFileSync(path.join(cwd, 'LICENSE'), 'utf8')
    let text = head + '<pre class="tropy-licence">\n' + licence + '</pre>\n'
    text += '<p>Tropy bundles the following third-party packages ' +
      'in accordance with the following licenses:</p>\n'

    for (let packageName of Object.keys(depLicenses).sort()) {
      const packageLicense = depLicenses[packageName]
      text += '<div class="dependency">'
      text += ` <a href="#" class="package">${packageName}</a>\n`
      text += ' <div class="license" style="display: none">\n'
      text += `  <div class="licence-name">${packageLicense.license}</div>\n`
      if (packageLicense.source) {
        text += `  <div class="licence-sourcefile">${packageLicense.source}</div>\n`
      }
      if (packageLicense.sourceText) {
        text += `  <pre class="licence-text">${packageLicense.sourceText}</pre>\n`
      }
      text += ' </div>\n</div>\n'
    }

    text += foot
    const outFile = path.join(cwd, 'dist', 'license.hbs')
    fs.writeFile(outFile, text, 'utf8', () => {
      console.log(`Wrote dependencies licenses to "${outFile}"`)
      console.log('Copy it to "tropy.org/views/license.hbs".')
    })
  })
