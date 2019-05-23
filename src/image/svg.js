'use strict'

const { nativeImage } = require('electron')
const { loadImage } = require('../dom')
const MIME = require('../constants/mime')

// eslint-disable-next-line max-len
const SVG = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!doctype svg[^>]*\s*(?:<![^>]*>)*[^>]*>\s*)?<svg[^>]*>/i
const COMMENTS = /<!--([\s\S]*?)-->/g


function createFromSVG(data) {
  return new Promise((resolve, reject) => {
    let svg = new Blob([data.toString('utf-8')], { type: MIME.SVG })
    let url = URL.createObjectURL(svg)

    loadImage(url)
      .then(img => {
        try {
          let canvas = document.createElement('canvas')

          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          canvas
            .getContext('2d')
            .drawImage(img, 0, 0)

          resolve(
            nativeImage.createFromDataURL(canvas.toDataURL())
          )
        } catch (error) {
          reject(error)
        } finally {
          URL.revokeObjectURL(url)
        }

      })
      .catch(reason => {
        URL.revokeObjectURL(url)
        reject(reason)
      })
  })
}

function isSVG(buffer) {
  return !isBinary(buffer) && SVG.test(buffer.toString().replace(COMMENTS, ''))
}

function isBinary(buffer) {
  for (let i = 0; i < 24; ++i) {
    if (buffer[i] === 65533 || buffer[i] <= 8) return true
  }

  return false
}

module.exports = {
  createFromSVG,
  isSVG
}
