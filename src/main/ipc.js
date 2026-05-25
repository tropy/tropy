import { ipcMain } from 'electron'
import { trace, warn } from '../common/log.js'

export function ipcServiceHandler (channel, handler) {
  let onInvoke = async (event, command, ...args) => {
    try {
      trace(`handling ipc ${channel}.${command}`)

      return {
        payload: await handler(event, command, ...args)
      }
    } catch (err) {
      warn({ err }, `ipc ${channel}.${command} failed`)

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
  }

  let onMessage = async (event, command, ...args) => {
    let result = await onInvoke(event, command, ...args)
    if (result.error && !event.sender.isDestroyed()) {
      event.sender.send(`${channel}/error`, command, result.payload)
    }
  }

  ipcMain.handle(channel, onInvoke)
  ipcMain.on(channel, onMessage)

  return () => {
    ipcMain.removeHandler(channel)
    ipcMain.removeListener(channel, onMessage)
  }
}
