import { FormToggle } from '../form.js'
import { useIpcEvent } from '../../hooks/use-ipc.js'
import { useWindowArgs } from '../../hooks/use-window.js'

export function DeveloperSettings() {
  let { api, debug, dev, port } = useWindowArgs()

  let handleDebugChange = useIpcEvent(null, [
    'cmd', 'app:toggle-debug-flag'
  ])

  let handleApiChange = useIpcEvent(null, [
    'cmd', 'app:toggle-api'
  ])

  return (
    <>
      <FormToggle
        id="prefs.app.debug"
        name="debug"
        isCompact
        isDisabled={dev}
        value={debug}
        onChange={handleDebugChange}/>
      <FormToggle
        id="prefs.app.api"
        name="api"
        isCompact
        value={api}
        onChange={handleApiChange}/>
      {api && (
        <a>{`http://localhost:${port}`}</a>
      )}
    </>
  )
}
