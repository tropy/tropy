'use strict'

const assert = require('assert')
const subject = require('./subject')
const { select, update } = require('../common/query')
const { empty, pick } = require('../common/util')

const COLUMNS = [
  'width',
  'height',
  'angle',
  'mirror',
  'negative',
  'brightness',
  'contrast',
  'hue',
  'saturation',
  'sharpen'
]

module.exports = {
  async rotate(db, { id, by }) {
    by = Number(by)

    assert(id != null, 'missing image id')
    assert(!isNaN(by), 'invalid angle')

    await db.run(
      ...update('images')
        .set(`angle = ((360 + (angle + ${by})) % 360)`)
        .where({ id }))

    let images = {}

    await db.each(
      ...select('id', 'angle').from('images').where({ id }),
      (image) => images[image.id] = { angle: image.angle })

    return images
  },

  async save(db, { id, timestamp, ...data }) {
    let image = pick(data, COLUMNS)
    if (empty(image)) return

    assert(id != null, 'missing image id')

    await db.run(
      ...update('images')
        .set(image)
        .where({ id }))

    if (timestamp != null) {
      await subject.touch(db, { id, timestamp })
    }
  }
}
