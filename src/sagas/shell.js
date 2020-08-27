import { shell as sh } from 'electron'
import { take } from 'redux-saga/effects'
import { warn } from '../common/log'
import { SHELL } from '../constants'

export function *shell() {
  while (true) {
    try {
      let { type, payload } = yield take(Object.values(SHELL))
      sh[type.split('.').pop()](...payload)
    } catch (e) {
      warn({ stack: e.stack }, 'unexpected error in *shell')
    }
  }
}
