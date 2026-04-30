import { ipcRenderer as ipc } from 'electron'
import { update } from '../slices/account.js'
import { prompt } from '../dialog.js'

const ERROR_PREFIX = 'account.'

const errorCode = (err) => (
  err?.message?.startsWith(ERROR_PREFIX) ? err.message : 'account.link.unknown'
)

export default {
  link ({ username, password }) {
    return async (dispatch) => {
      dispatch(update({ status: 'pending', error: null }))
      try {
        let result = await ipc.invoke('account:link', { username, password })
        dispatch(update({ ...result, status: 'idle', error: null }))
      } catch (err) {
        dispatch(update({ status: 'error', error: errorCode(err) }))
      }
    }
  },

  unlink () {
    return async (dispatch) => {
      let { cancel } = await prompt('account.unlink', { type: 'warning' })
      if (cancel) return

      dispatch(update({ status: 'pending', error: null }))
      try {
        let result = await ipc.invoke('account:unlink')
        dispatch(update({ ...result, status: 'idle', error: null }))
      } catch (err) {
        dispatch(update({ status: 'error', error: errorCode(err) }))
      }
    }
  },

  status () {
    return async (dispatch) => {
      let result = await ipc.invoke('account:status')
      dispatch(update(result))
    }
  }
}
