
import { useEventHandler } from './use-event-handler.js'
import { getClipboardData, hasClipboardImage } from '../clipboard.js'
import { isInput } from '../dom.js'

export function usePasteEvent(format, handler) {
  useEventHandler(window, 'paste', (event) => {
    if (isInput(event.target || event.srcElement))
      return

    // Skip if clipboard has image data (image paste takes priority)
    if (hasClipboardImage(event))
      return

    let data = getClipboardData(event, format)

    if (data == null)
      return

    event.preventDefault()
    event.stopPropagation()

    handler(data)

  }, false, true)
}
