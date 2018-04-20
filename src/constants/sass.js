'use strict'

const { times } = require('../common/util')
const { round } = Math

const ACTIVITY = {
  HEIGHT: 43
}

const ABOUT = {
  WIDTH: 600,
  HEIGHT: 300
}

const COLUMN = {
  MIN: 48,
  POSITION: 54,
  PADDING: 5 + 4,
  FIRST: 3

}

const FONTSIZE = {
  SMALL: 12,
  BASE: 13,
  LARGE: 16
}

const GRID = {
  SIZE: 12,
  PADDING: 12
}

const ICON = {
  SIZE: 48,
  MAX: 512
}

const TILE = {
  MIN: ICON.SIZE,
  FACTOR: 1.2
}

const ROW = {
  HEIGHT: 30
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

PANEL.DEFAULT_WIDTH = PANEL.MIN_WIDTH

const SCROLLBAR = {
  WIDTH: 12
}

const SIDEBAR = {
  MIN_WIDTH: 150,
  MAX_WIDTH: 500,
  DEFAULT_WIDTH: 250
}

const PROJECT = {
  WIDTH: 1280,
  HEIGHT: 720,
  MIN_WIDTH: SIDEBAR.MIN_WIDTH + PANEL.MIN_WIDTH * 2,
  MIN_HEIGHT: PANEL.MIN_HEIGHT * 3 + PANEL.TOOLBAR + PANEL.HEADER_MARGIN
}

const EDITOR = {
  MAX_PADDING: 48
}

const NOTE = {
  ROW_HEIGHT: 60
}

const ESPER = {
  MIN_HEIGHT: PROJECT.MIN_HEIGHT / 2,
  FADE_DURATION: 250,
  ROTATE_DURATION: 250,
  MAX_ZOOM: 4,
  MIN_ZOOM: 1,
  PAN_STEP_SIZE: 10,
  PAN_DURATION: 250,
  SYNC_DURATION: 600,
  ZOOM_LINEAR_MAX: 1.96,
  ZOOM_SLIDER_PRECISION: 100,
  ZOOM_SLIDER_STEPS: [0.5, 1, 2, 3],
  ZOOM_STEP_SIZE: 1.0,
  ZOOM_DURATION: 300,
  ZOOM_PRECISION: 10000,
  ZOOM_WHEEL_FACTOR: 1 / 500,

  CURSOR: {
    arrow: {
      default: 'arrow',
      active: 'arrow',
      x: '1',
      y: '1'
    },
    move: {
      move: 'arrow',
      active: 'arrow',
      x: '1',
      y: '1'
    },
    pan: {
      default: 'grab',
      active: 'grabbing',
      x: '9',
      y: '9'
    },
    select: {
      default: 'crosshairs',
      active: 'crosshairs',
      x: '7',
      y: '7'
    },
    zoomIn: {
      default: 'zoom-in',
      active: 'zoom-in',
      x: '8',
      y: '8'
    },
    zoomOut: {
      default: 'zoom-out',
      active: 'zoom-out',
      x: '8',
      y: '8'
    }
  }
}

const INPUT = {
  BORDER_WIDTH: 1,
  FOCUS_SHADOW_WIDTH: 2
}

const OPTION = {
  HEIGHT: 26,
  LIST_MARGIN: 4
}

const POPUP = {
  PADDING: 2
}

const PREFS = {
  WIDTH: 600,
  HEIGHT: 580
}

const WIZARD = {
  WIDTH: 456,
  HEIGHT: 580
}


module.exports =  {
  ABOUT,
  ACTIVITY,
  COLUMN,
  EDITOR,
  ESPER,
  FONTSIZE,
  GRID,
  ICON,
  INPUT,
  ITEM,
  NOTE,
  OPTION,
  PANEL,
  PHOTO,
  POPUP,
  PREFS,
  PROJECT,
  ROW,
  SCROLLBAR,
  SIDEBAR,
  TILE,
  WIZARD
}
