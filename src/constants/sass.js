'use strict'

const { times } = require('../common/util')
const { round } = Math

const ICON = {
  SIZE: 48,
  MAX: 512
}

const TILE = {
  MIN: ICON.SIZE,
  FACTOR: 1.2
}

const ITEM = {
  TILE: {
    MIN: TILE.MIN,
    MAX: ICON.MAX,
    FACTOR: TILE.FACTOR
  }
}

ITEM.ZOOM = [
  ICON.SIZE / 2,
  ITEM.TILE.MIN,
  ...times(
    (ITEM.TILE.MAX / 2 - 4 - ITEM.TILE.MIN) / 4,
    i => i * 4 + ITEM.TILE.MIN + 4
  ),
  ...times(
    ITEM.TILE.MAX / 2 / 8, i => i * 8 + ITEM.TILE.MAX / 2
  ),
  ITEM.TILE.MAX
]


const PHOTO = {
  TILE: {
    MIN: TILE.MIN,
    MAX: 256,
    FACTOR: TILE.FACTOR
  }
}

PHOTO.ZOOM = [
  ICON.SIZE / 2,
  PHOTO.TILE.MIN,
  ...times(
    (PHOTO.TILE.MAX / 2 - 4 - PHOTO.TILE.MIN) / 4,
    i => i * 4 + PHOTO.TILE.MIN + 4
  ),
  ...times(
    PHOTO.TILE.MAX / 2 / 8, i => i * 8 + PHOTO.TILE.MAX / 2
  ),
  PHOTO.TILE.MAX
]


const PANEL = {
  MIN_HEIGHT: 100,

  HEADER_HEIGHT: 30,
  HEADER_MARGIN: 4,

  TOOLBAR: 46,

  PADDING: 12
}

PANEL.CLOSED_HEIGHT =
  PANEL.HEADER_HEIGHT + PANEL.HEADER_MARGIN

PANEL.MIN_WIDTH =
  round(PHOTO.TILE.MAX * PHOTO.TILE.FACTOR + 2 * PANEL.PADDING)

PANEL.MAX_WIDTH =
  PANEL.MIN_WIDTH * 2


const ACTIVITY = {
  HEIGHT: 43
}

const SCROLLBAR = {
  WIDTH: 12
}

const SIDEBAR = {
  MIN_WIDTH: 150,
  MAX_WIDTH: 500
}

const WINDOW = {
  WIDTH: 1280,
  HEIGHT: 720,
  MIN_WIDTH: SIDEBAR.MIN_WIDTH + PANEL.MIN_WIDTH * 2,
  MIN_HEIGHT: PANEL.MIN_HEIGHT * 3 + PANEL.TOOLBAR + PANEL.HEADER_MARGIN
}

const NOTEPAD = {
  MIN_HEIGHT: 100
}

const WIZARD = {
  WIDTH: 456,
  HEIGHT: 580
}

const PREFS = {
  WIDTH: 600,
  HEIGHT: 580
}

module.exports =  {
  ACTIVITY,
  ICON,
  ITEM,
  PANEL,
  PHOTO,
  PREFS,
  SCROLLBAR,
  SIDEBAR,
  TILE,
  WINDOW,
  WIZARD,
  NOTEPAD
}

