import { warn } from './common/log.js'

export function getClipboardData(event, format = 'text/plain') {
  let data

  try {
    switch (format) {
      case 'text/plain':
        data = event.clipboardData.getData('text/plain')
        break

      case 'application/json':
        data = event.clipboardData.getData('text/plain')
        if (data) data = JSON.parse(data)

        break

      default:
        throw new Error(`format unknown: ${format}`)
    }

  } catch (e) {
    warn({ stack: e.stack, data }, 'pasted unsupported data')
  }

  return data
}
