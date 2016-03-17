'use strict'
if (process.type === 'browser') {
  __require('browser/path')
} else {
  __require('bootstrap')
}
