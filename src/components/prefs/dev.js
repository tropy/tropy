import { FormToggle } from '../form.js'
import { useIpcEvent } from '../../hooks/use-ipc.js'
import { useWindowArgs } from '../../hooks/use-window.js'

export function DevolperSettings() {
  let { debug, dev } = useWindowArgs()

  let handleDebugChange = useIpcEvent(null, ['cmd', 'app:toggle-debug-flag'])
  return (
    <>
      <FormToggle
        id="prefs.app.debug"
        name="debug"
        isDisabled={dev}
        value={debug}
        onChange={handleDebugChange}/>
    </>
  )
}
