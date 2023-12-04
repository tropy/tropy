import { arrayOf, string } from 'prop-types'
import { FormSelect } from '../form.js'
import { useIpcEvent } from '../../hooks/use-ipc.js'
import { useWindowArgs } from '../../hooks/use-window.js'

export function LocaleSettings({ options }) {
  let { locale } = useWindowArgs()

  let handleLocaleChange = useIpcEvent(event => (
    event.locale
  ), ['cmd', 'app:switch-locale'])

  return (
    <FormSelect
      id="prefs.app.locale.locale"
      name="locale"
      isRequired
      isSelectionHidden
      value={locale}
      options={options}
      tabIndex={0}
      onChange={handleLocaleChange}/>
  )
}

LocaleSettings.propTypes = {
  options: arrayOf(string).isRequired
}

LocaleSettings.defaultProps = {
  options: [
    'cn',
    'de',
    'en',
    'es',
    'fr',
    'it',
    'ja',
    'nl-NL',
    'pt',
    'pt-BR',
    'uk'
  ]
}
