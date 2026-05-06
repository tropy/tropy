import { ipcMain } from 'electron'
import { trace, warn } from '../common/log.js'

export function ipcActionHandler (channel, handler) {
  ipcMain.handle(channel, async (event, command, ...args) => {
    try {
      trace(`handling ipc action ${channel}.${command}`)

      return {
        payload: await handler(event, command, ...args)
      }
    } catch (err) {
      warn({ err }, `ipc action handler ${channel}.${command} failed`)

      return {
        error: true,
        payload: {
          channel,
          command,
          code: err.code,
          message: err.message,
          name: err.name
        }
      }
    }
  })

  return () => {
    ipcMain.removeHandler(channel)
  }
}
