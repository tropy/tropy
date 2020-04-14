'use strict'

const assert = require('assert')
const EventEmitter = require('events')
const PIXI = require('pixi.js-legacy')
const { TextureCache, skipHello } = PIXI.utils
const { append } = require('../dom')
const { info } = require('../common/log')
const util = require('./util')
const { TOOL } = require('../constants/esper')

PIXI.settings.RETINA_PREFIX = /@2x!/


class Esper extends EventEmitter {
  static #INSTANCE = null

  static get instance() {
    return Esper.#INSTANCE
  }

  constructor(opts) {
    super()

    assert(Esper.#INSTANCE == null, 'old Esper.instance present')
    Esper.#INSTANCE = this

    skipHello()

    this.app = new PIXI.Application({
      antialias: false,
      autoDensity: true,
      forceCanvas: !ARGS.webgl,
      roundPixels: false,
      transparent: true,
      ...opts
    })

    this.app.renderer.autoResize = true

    for (let name in TOOL)
      util.addCursorStyle(
        this.app.renderer.plugins.interaction.cursorStyles,
        TOOL[name])

    this.app.loader.onError.add((...args) =>
      this.emit('load.error', ...args))
    this.app.loader.onLoad.add((...args) =>
      this.emit('load', ...args))
    this.app.ticker.add((...args) =>
      this.emit('tick', ...args))

    info(`Esper.instance created using ${
      this.app.renderer instanceof PIXI.CanvasRenderer ? 'canvas' : 'webgl'
    } renderer`)
  }

  destroy() {
    this.app.destroy(true)
    this.removeAllListeners()

    assert(Esper.#INSTANCE === this, 'tried to destroy dangling Esper.instance')
    Esper.#INSTANCE = null
  }

  load(url) {
    return new Promise((resolve, reject) => {

      if (TextureCache[url]) {
        return resolve(TextureCache[url])
      }

      this.app.loader
        .reset()
        .add(url)
        .load((_, { [url]: res }) => {
          if (res == null) return reject()
          if (res.error) return reject(res.error)

          // Loading typically happens on item open while
          // the view transition is in progress: this
          // adds a slight delay but improves the overall
          // smoothness of the transition!
          requestIdleCallback(() => resolve(res.texture), { timeout: 500 })
        })
    })
  }

  mount(element) {
    append(this.app.view, element)
  }

  render() {
    this.app.render()
  }

  start() {
    this.app.start()
  }

  stop() {
    this.app.stop()
  }
}


module.exports = {
  Esper,
  ...util
}
