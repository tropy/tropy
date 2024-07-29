import { FormElement } from '../form.js'
import { TemplateSelect } from '../template/select.js'
import { IconItemSmall, IconPhoto, IconSelection } from '../icons.js'
import { useEvent } from '../../hooks/use-event.js'
import { tropy } from '../../ontology/ns.js'

export function TemplateSettings({ config, onChange }) {
  let handleTemplateChange = useEvent((values, hasChanged) => {
    if (hasChanged) {
      let [type, template] = Object.entries(values)[0]
      onChange({
        templates: {
          [type]: template.id
        }
      })
    }
  })

  return (
    <FormElement id="prefs.app.templates.label">
      <TemplateSelect
        icon={<IconItemSmall/>}
        id="prefs.app.templates.label"
        isRequired
        name="item"
        type={tropy.Item}
        value={config.item}
        tabIndex={0}
        onChange={handleTemplateChange}/>
      <TemplateSelect
        icon={<IconPhoto/>}
        isRequired
        name="photo"
        type={tropy.Photo}
        value={config.photo}
        tabIndex={0}
        onChange={handleTemplateChange}/>
      <TemplateSelect
        icon={<IconSelection/>}
        isRequired
        name="selection"
        type={tropy.Selection}
        value={config.selection}
        tabIndex={0}
        onChange={handleTemplateChange}/>
    </FormElement>
  )
}
