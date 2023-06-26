import { useState } from 'react'
import { arrayOf, string } from 'prop-types'
import { darwin } from '../../common/os.js'
import { FormToggle, FormSelect } from '../form.js'
import { useIpc } from '../../hooks/use-ipc.js'
import { useWindowArgs } from '../../hooks/use-window.js'
import { useEvent } from '../../hooks/use-event.js'

export function StyleSettings({ themes, fontSizes }) {
  let ipc = useIpc()

  let { frameless, fontSize, theme } = useWindowArgs()
  let [localFrameless, setLocalFrameless] = useState(frameless)

  let handleThemeChange = useEvent(event => {
    ipc.send('cmd', 'app:switch-theme', event.theme)
  })

  let handleFontSizeChange = useEvent(event => {
    ipc.send('cmd', 'app:change-font-size', event.fontSize)
  })

  let handleFramelessChange = useEvent(() => {
    ipc.send('cmd', 'app:toggle-frameless-flag', !localFrameless)
    setLocalFrameless(!localFrameless)
  })

  return (
    <>
      <FormSelect
        id="prefs.app.style.theme"
        name="theme"
        isRequired
        isSelectionHidden
        value={theme}
        options={themes}
        onChange={handleThemeChange}/>
      <FormSelect
        id="prefs.app.style.font.size"
        name="fontSize"
        isRequired
        isInputHidden
        value={fontSize}
        options={fontSizes}
        onChange={handleFontSizeChange}/>
      { !darwin && (
        <>
          <FormToggle
            id="prefs.app.style.frameless"
            name="frameless"
            value={localFrameless}
            onChange={handleFramelessChange}/>
        </>
      )}
    </>
  )
}

StyleSettings.propTypes = {
  fontSizes: arrayOf(string).isRequired,
  themes: arrayOf(string).isRequired
}

StyleSettings.defaultProps = {
  fontSizes: ['12px', '13px', '14px', '15px', '16px'],
  themes: ['light', 'dark', 'system']
}
