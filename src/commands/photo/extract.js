'use strict'

const { Command } = require('../command')
const { call } = require('redux-saga/effects')
const { PHOTO } = require('../../constants')
const { writeFile } = require('fs').promises
const { RenderTexture } = require('pixi.js-legacy')
const { Esper } = require('../../esper')

class Extract extends Command {
  *exec() {
    // let { id } = this.action.payload
    let esper = Esper.instance

    let texture = RenderTexture.create(
      esper.photo.bg.width,
      esper.photo.bg.height
    )

    esper.renderer.render(esper.photo, texture)

    let canvas = esper.renderer.plugins.extract.canvas(texture)
    let blob = yield call(() => new Promise((resolve) => {
      canvas.toBlob(resolve)
    }))

    let data = yield call([blob, blob.arrayBuffer])

    yield call(writeFile, '/Users/dupin/Desktop/out.png', Buffer.from(data))

    // esper.renderer.plugins.extract.destroy()
    texture.destroy()
  }
}

Extract.register(PHOTO.EXTRACT)

module.exports = {
  Extract
}
