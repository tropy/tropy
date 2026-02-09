import { clipboard } from 'electron'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
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

export function hasClipboardImage(event) {
  let items = event.clipboardData?.items
  if (!items) return false
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/'))
      return true
  }
  return false
}

export function saveClipboardImage() {
  let image = clipboard.readImage()
  if (image.isEmpty()) return null

  let pasteDir = join(tmpdir(), 'tropy-paste')
  mkdirSync(pasteDir, { recursive: true })

  // Clean up previous temp files before writing a new one
  try {
    for (let file of readdirSync(pasteDir)) {
      try { unlinkSync(join(pasteDir, file)) } catch (_) { /* in use */ }
    }
  } catch (_) { /* ignore cleanup errors */ }

  let timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '')

  let filename = `paste_${timestamp}.png`
  let filePath = join(pasteDir, filename)
  let buffer = image.toPNG()

  writeFileSync(filePath, buffer)
  return filePath
}
