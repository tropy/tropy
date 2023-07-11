import { useSelector } from 'react-redux'
import { func, object } from 'prop-types'
import { FormElement } from '../form.js'
import { TemplateSelect } from '../template/select.js'
import { IconItemSmall, IconPhoto, IconSelection } from '../icons.js'
import { useEvent } from '../../hooks/use-event.js'
import { getAllTemplatesByType } from '../../selectors/index.js'

export function TemplateSettings({ config, onChange }) {
  let templates = useSelector(getAllTemplatesByType)

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
        options={templates.item}
        value={config.item}
        tabIndex={0}
        onChange={handleTemplateChange}/>
      <TemplateSelect
        icon={<IconPhoto/>}
        isRequired
        name="photo"
        options={templates.photo}
        value={config.photo}
        tabIndex={0}
        onChange={handleTemplateChange}/>
      <TemplateSelect
        icon={<IconSelection/>}
        isRequired
        name="selection"
        options={templates.selection}
        value={config.selection}
        tabIndex={0}
        onChange={handleTemplateChange}/>
    </FormElement>
  )
}

TemplateSettings.propTypes = {
  config: object.isRequired,
  onChange: func.isRequired
}
