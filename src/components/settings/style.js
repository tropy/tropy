import { useState } from 'react'
import { darwin } from '../../common/os.js'
import { FormToggle, FormSelect } from '../form.js'
import { useIpcEvent } from '../../hooks/use-ipc.js'
import { useWindowArgs } from '../../hooks/use-window.js'

export function StyleSettings({
  fontSizes = ['12px', '13px', '14px', '15px', '16px'],
  themes = ['light', 'dark', 'system']
}) {
  let { frameless, fontSize, theme } = useWindowArgs()
  let [localFrameless, setLocalFrameless] = useState(frameless)

  let handleThemeChange = useIpcEvent(event => (
    event.theme
  ), ['cmd', 'app:switch-theme'])

  let handleFontSizeChange = useIpcEvent(event => (
    event.fontSize
  ), ['cmd', 'app:change-font-size'])

  let handleFramelessChange = useIpcEvent(() => {
    setLocalFrameless(!localFrameless)
    return !localFrameless
  }, ['cmd', 'app:toggle-frameless-flag'])

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
