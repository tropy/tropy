import { FormElement, Toggle } from '../form.js'

export function SearchSettings ({ config, onChange }) {
  let handleChange = (data) => {
    onChange({ search: data })
  }

  return (
    <FormElement
      id="prefs.app.search.label"
      isCompact>
      <Toggle
        id="prefs.app.search.highlight"
        name="highlight"
        value={config.highlight}
        onChange={handleChange}/>
      <Toggle
        id="prefs.app.search.filter"
        name="filter"
        value={config.filter}
        onChange={handleChange}/>
    </FormElement>
  )
}
