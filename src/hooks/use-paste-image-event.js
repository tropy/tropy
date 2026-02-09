
import { useEventHandler } from './use-event-handler.js'
import { hasClipboardImage, saveClipboardImage } from '../clipboard.js'
import { isInput } from '../dom.js'
import { warn } from '../common/log.js'

export function usePasteImageEvent(handler) {
  useEventHandler(window, 'paste', (event) => {
    if (isInput(event.target || event.srcElement))
      return

    if (!hasClipboardImage(event))
      return

    try {
      let filePath = saveClipboardImage()
      if (!filePath) return

      event.preventDefault()
      event.stopPropagation()

      handler({ files: [filePath] })
    } catch (e) {
      warn({ stack: e.stack }, 'failed to paste image from clipboard')
    }

  }, false, true)
}
