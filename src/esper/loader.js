'use strict'

const EventEmitter = require('events')
const res = require('../common/res')
const { warn } = require('../common/log')
const PIXI = require('pixi.js')

const { Texture, BaseTexture } = PIXI
const { ImageBitmapResource } = PIXI.resources
const { TextureCache } = PIXI.utils

ImageBitmapResource.prototype.dispose = function () {
  this.source?.close()
  this.source = null
}

class Loader extends EventEmitter {
  #pending = new Map()
  #worker

  constructor() {
    super()
    this.#worker = new Worker(res.worker.expand('loader'))
    this.#worker.onmessage = this.handleWorkerMessage
  }

  handleWorkerMessage = ({ data }) => {
    switch (data?.type) {
      case 'error':
        this.#pending.get(data.meta.url).reject(data.payload)
        break
      case 'load':
        this.#pending.get(data.meta.url).resolve(data.payload)
        break
      default:
        warn(`unknown worker message: ${data}`)
    }
  }

  destroy() {
    this.#worker.terminate()
    this.#worker = null

    for (let [, deferred] of this.#pending) {
      deferred.reject(new Error('worker terminated'))
    }
  }

  load(url) {
    if  (this.#pending.has(url)) {
      return this.#pending.get(url).promise
    }

    let deferred = {}
    this.#pending.set(url, deferred)

    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve
      deferred.reject = reject

      this.#worker.postMessage({
        type: 'load',
        payload: url
      })
    }).finally(() => {
      this.#pending.delete(url)
    })

    return deferred.promise
  }

  async loadTexture(url) {
    let texture = TextureCache[url]

    if (!texture) {
      let bitmap = await this.load(url)
      let source = new ImageBitmapResource(bitmap)

      texture =  new Texture(new BaseTexture(source))
      this.addToCache(texture, url)
    }

    return texture
  }

  addToCache(texture, url) {
    texture.cacheId = url
    BaseTexture.addToCache(texture.baseTexture, url)
    Texture.addToCache(texture, url)
  }
}

module.exports = {
  Loader
}
