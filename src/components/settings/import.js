import { TitleSettings } from './title.js'
import { FormField, FormToggleGroup, FormElement, Toggle } from '../form.js'
import { IMAGE } from '../../constants/index.js'

const DUP_OPTS = ['skip', 'import', 'prompt']

export function ImportSettings ({ config, onChange }) {
  return (
    <>
      <FormToggleGroup
        id="prefs.app.dup"
        name="dup"
        isCompact
        value={config.dup}
        options={DUP_OPTS}
        onChange={onChange}/>
      <FormElement>
        <Toggle
          id="prefs.app.localtime"
          name="localtime"
          value={config.localtime}
          onChange={onChange}/>
        <Toggle
          id="prefs.app.createLists"
          name="createLists"
          value={config.createLists}
          onChange={onChange}/>
      </FormElement>
      <TitleSettings
        config={config.title}
        onChange={onChange}/>
      <FormField
        id="prefs.app.density.label"
        isCompact
        isRequired
        max={IMAGE.MAX_DENSITY}
        min={IMAGE.MIN_DENSITY}
        name="density"
        onChange={onChange}
        title="prefs.app.density.title"
        tabIndex={0}
        type="number"
        value={config.density}/>
    </>
  )
}
